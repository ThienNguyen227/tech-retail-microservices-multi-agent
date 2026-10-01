import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';

@Injectable()
export class MomoIpnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async handleIpn(data: any) {
    console.log('========== MOMO IPN ==========');
    console.log(data);
    console.log('==============================');

    const {
      resultCode,
      message,
      orderId,
      transId,
      amount,
    } = data;

    // ============================================================
    // 1. Validate dữ liệu từ MoMo
    // ============================================================

    if (!orderId) {
      throw new BadRequestException(
        'Thiếu orderId từ MoMo',
      );
    }

    if (amount === undefined || amount === null) {
      throw new BadRequestException(
        'Thiếu amount từ MoMo',
      );
    }

    if (resultCode === undefined || resultCode === null) {
      throw new BadRequestException(
        'Thiếu resultCode từ MoMo',
      );
    }

    // ============================================================
    // 2. Tìm PaymentTransaction
    // ============================================================

    const transaction =
      await this.prisma.paymentTransaction.findUnique({
        where: {
          payment_transaction_transaction_code: orderId,
        },
        include: {
          payment: true,
        },
      });

    if (!transaction) {
      throw new NotFoundException(
        `Không tìm thấy PaymentTransaction: ${orderId}`,
      );
    }

    const payment = transaction.payment;

    // ============================================================
    // 3. Kiểm tra số tiền
    // ============================================================

    if (
      Number(payment.payment_amount) !== Number(amount)
    ) {
      throw new BadRequestException(
        'Số tiền MoMo không khớp với Payment',
      );
    }

    // ============================================================
    // 4. Lấy PaymentTransactionStatus
    // ============================================================

    const successTransactionStatus =
      await this.prisma.paymentTransactionStatus.findUnique({
        where: {
          payment_transaction_status_code: 'SUCCESS',
        },
      });

    const failedTransactionStatus =
      await this.prisma.paymentTransactionStatus.findUnique({
        where: {
          payment_transaction_status_code: 'FAILED',
        },
      });

    if (
      !successTransactionStatus ||
      !failedTransactionStatus
    ) {
      throw new NotFoundException(
        'Không tìm thấy PaymentTransactionStatus',
      );
    }

    // ============================================================
    // 5. Lấy PaymentStatus
    // ============================================================

    const paidPaymentStatus =
      await this.prisma.paymentStatus.findUnique({
        where: {
          payment_status_code: 'PAID',
        },
      });

    const unpaidPaymentStatus =
      await this.prisma.paymentStatus.findUnique({
        where: {
          payment_status_code: 'UNPAID',
        },
      });

    if (
      !paidPaymentStatus ||
      !unpaidPaymentStatus
    ) {
      throw new NotFoundException(
        'Không tìm thấy PaymentStatus PAID / UNPAID',
      );
    }

    // ============================================================
    // 6. Xác định kết quả thanh toán
    // ============================================================

    const isSuccess = Number(resultCode) === 0;

    // ============================================================
    // 7. Transaction cập nhật PaymentTransaction + Payment
    // ============================================================

    await this.prisma.$transaction(async (tx) => {
      // ==========================================================
      // 7.1. SUCCESS
      // ==========================================================

      if (isSuccess) {
        // PaymentTransaction -> SUCCESS
        await tx.paymentTransaction.update({
          where: {
            payment_transaction_id:
              transaction.payment_transaction_id,
          },

          data: {
            payment_transaction_status_id:
              successTransactionStatus.payment_transaction_status_id,

            payment_transaction_gateway_transaction_id:
              transId
                ? String(transId)
                : null,

            payment_transaction_gateway_response_code:
              String(resultCode),

            payment_transaction_gateway_message:
              message ?? null,

            payment_transaction_gateway_response:
              data,
          },
        });

        // Payment -> PAID
        await tx.payment.update({
          where: {
            payment_id: payment.payment_id,
          },

          data: {
            payment_status_id:
              paidPaymentStatus.payment_status_id,
          },
        });

        return;
      }

      // ==========================================================
      // 7.2. FAILED / CANCEL
      // ==========================================================

      // PaymentTransaction -> FAILED
      await tx.paymentTransaction.update({
        where: {
          payment_transaction_id:
            transaction.payment_transaction_id,
        },

        data: {
          payment_transaction_status_id:
            failedTransactionStatus.payment_transaction_status_id,

          payment_transaction_gateway_transaction_id:
            transId
              ? String(transId)
              : null,

          payment_transaction_gateway_response_code:
            String(resultCode),

          payment_transaction_gateway_message:
            message ?? null,

          payment_transaction_gateway_response:
            data,
        },
      });

      // ----------------------------------------------------------
      // Chỉ chuyển Payment -> UNPAID nếu Payment
      // chưa PAID.
      //
      // Không bao giờ:
      // PAID -> UNPAID
      // ----------------------------------------------------------

      if (
        payment.payment_status_id !==
        paidPaymentStatus.payment_status_id
      ) {
        await tx.payment.update({
          where: {
            payment_id: payment.payment_id,
          },

          data: {
            payment_status_id:
              unpaidPaymentStatus.payment_status_id,
          },
        });
      }
    });

    // Publish event to RabbitMQ chưa Outbox Pattern
    await this.rabbitMQService.publish( 
      isSuccess ? 'payment.succeeded' : 'payment.failed',
      { orderId: payment.payment_order_id, }, 
    );

    // ============================================================
    // 8. Trả kết quả cho MoMo
    // ============================================================

    return {
      resultCode,
      message: isSuccess
        ? 'Success'
        : message,
    };
  }

}

