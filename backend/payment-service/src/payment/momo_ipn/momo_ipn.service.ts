import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MomoIpnService {
  constructor(
    private readonly prisma: PrismaService,
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

    // orderId của MoMo chính là
    // payment_transaction_transaction_code
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
      Number(payment.payment_amount) !==
      Number(amount)
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
    // 6. MOMO SUCCESS
    // ============================================================

    if (Number(resultCode) === 0) {
      await this.prisma.$transaction([
        // --------------------------------------------------------
        // PaymentTransaction = SUCCESS
        // --------------------------------------------------------

        this.prisma.paymentTransaction.update({
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
        }),

        // --------------------------------------------------------
        // Payment = PAID
        // --------------------------------------------------------

        this.prisma.payment.update({
          where: {
            payment_id: payment.payment_id,
          },
          data: {
            payment_status_id:
              paidPaymentStatus.payment_status_id,
          },
        }),
      ]);

      return {
        resultCode: 0,
        message: 'Success',
      };
    }

    // ============================================================
    // 7. MOMO FAILED
    // ============================================================

    await this.prisma.$transaction([
      // ----------------------------------------------------------
      // PaymentTransaction = FAILED
      // ----------------------------------------------------------

      this.prisma.paymentTransaction.update({
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
      }),

      // ----------------------------------------------------------
      // Payment = UNPAID
      //
      // Chỉ chuyển về UNPAID nếu Payment chưa PAID.
      // Không được làm PAID -> UNPAID.
      // ----------------------------------------------------------

      ...(payment.payment_status_id !==
      paidPaymentStatus.payment_status_id
        ? [
            this.prisma.payment.update({
              where: {
                payment_id: payment.payment_id,
              },
              data: {
                payment_status_id:
                  unpaidPaymentStatus.payment_status_id,
              },
            }),
          ]
        : []),
    ]);

    return {
      resultCode,
      message,
    };
  }
}

