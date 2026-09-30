import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from '../../dto/create_payment.dto';
import { Prisma } from '@prisma/client';

import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class CreatePaymentService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE PAYMENT
  // ============================================================
  async createPayment(createPaymentDto: CreatePaymentDto) {
    const { order_id, payment_method_id } = createPaymentDto;

    // ============================================================
    // 1. Lấy thông tin Order từ Order-Service
    // ============================================================

    let order;

    try {
      const response = await axios.get(`http://localhost:3007/api/v1/order/payment?orderId=${order_id}`);
      order = response.data;
    } catch (error) {
      console.error('GET ORDER ERROR:', error);

      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // ============================================================
    // 2. Lấy dữ liệu từ Order
    // ============================================================

    const orderId = order.order_id;
    const orderCode = order.order_code;
    const userId = order.order_user_id;
    const amount = Number(order.order_total_amount);

    // ============================================================
    // 3. Lấy Payment Method
    // ============================================================

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: {
        payment_method_id,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Không tìm thấy phương thức thanh toán');
    }

    // ============================================================
    // 4. Lấy Payment Status = UNPAID
    // ============================================================

    const unpaidStatus = await this.prisma.paymentStatus.findUnique({
      where: {
        payment_status_code: 'UNPAID',
      },
    });

    if (!unpaidStatus) {
      throw new InternalServerErrorException('Không tìm thấy trạng thái UNPAID');
    }

    // ============================================================
    // 5. Lấy Transaction Status = PENDING
    // ============================================================

    const pendingStatus = await this.prisma.paymentTransactionStatus.findUnique({
      where: {
        payment_transaction_status_code: 'PENDING',
      },
    });

    if (!pendingStatus) {
      throw new InternalServerErrorException('Không tìm thấy trạng thái PENDING');
    }

    // ============================================================
    // 6. Payment + PaymentTransaction
    //    Thực hiện trong cùng một Database Transaction
    // ============================================================

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // ========================================================
          // 6.1. Tìm Payment theo Order
          // ========================================================

          let payment = await tx.payment.findFirst({
            where: {
              payment_order_id: orderId,
            },
          });

          // ========================================================
          // 6.2. Nếu chưa có Payment → tạo Payment
          // ========================================================

          if (!payment) {
            payment = await tx.payment.create({
              data: {
                payment_order_id: orderId,
                payment_order_code: orderCode,
                payment_user_id: userId,
                payment_amount: amount,
                payment_currency: 'VND',
                payment_method_id: payment_method_id,
                payment_status_id: unpaidStatus.payment_status_id,
              },
            });
          }

          // ========================================================
          // 6.3. Tạo Payment Transaction
          // ========================================================

          const transactionCode = this.generateTransactionCode();

          const transaction = await tx.paymentTransaction.create({
            data: {
              payment_id: payment.payment_id,

              payment_transaction_transaction_code: transactionCode,

              payment_transaction_status_id: pendingStatus.payment_transaction_status_id,
            },
          });

          return {
            payment,
            transaction,
            transactionCode,
          };
        },
      );

      const {
        payment,
        transaction,
        transactionCode,
      } = result;

      // ============================================================
      // 7. COD
      // ============================================================

      if (paymentMethod.payment_method_code === 'COD') {
        return {
          payment: {
            payment_id: payment.payment_id,
            order_id: payment.payment_order_id,
            order_code: payment.payment_order_code,
            amount: payment.payment_amount,
            currency: payment.payment_currency,
            method: paymentMethod.payment_method_code,
            status: 'UNPAID',
          },

          transaction: {
            transaction_id:
              transaction.payment_transaction_id,

            transaction_code:
              transaction.payment_transaction_transaction_code,

            status: 'PENDING',
          },

          payUrl: null,

          message: 'Thanh toán khi nhận hàng',
        };
      }

      // ============================================================
      // 8. MOMO
      // ============================================================

      if (paymentMethod.payment_method_code === 'MOMO') {
        try {
          const payUrl = await this.createMomoPayment({
            payment,
            transactionCode,
            amount,
          });

          return {
            payment: {
              payment_id: payment.payment_id,
              order_id: payment.payment_order_id,
              order_code: payment.payment_order_code,
              amount: payment.payment_amount,
              currency: payment.payment_currency,
              method: paymentMethod.payment_method_code,
              status: 'UNPAID',
            },

            transaction: {
              transaction_id:
                transaction.payment_transaction_id,

              transaction_code:
                transaction.payment_transaction_transaction_code,

              status: 'PENDING',
            },

            payUrl,

            message: 'Tạo thanh toán MoMo thành công',
          };
        } catch (error) {
          // ============================================================
          // MoMo thất bại → PENDING → FAILED
          // ============================================================

          const failedStatus =
            await this.prisma.paymentTransactionStatus.findUnique({
              where: {
                payment_transaction_status_code: 'FAILED',
              },
            });

          if (!failedStatus) {
            throw new InternalServerErrorException(
              'Không tìm thấy trạng thái FAILED',
            );
          }

          await this.prisma.paymentTransaction.update({
            where: {
              payment_transaction_id:
                transaction.payment_transaction_id,
            },

            data: {
              payment_transaction_status_id:
                failedStatus.payment_transaction_status_id,
            },
          });

          throw error;
        }
      }

      // ============================================================
      // 9. Phương thức thanh toán chưa hỗ trợ
      // ============================================================

      throw new BadRequestException(
        'Phương thức thanh toán chưa được hỗ trợ',
      );
    } catch (error) {
      // ============================================================
      // 10. Prisma P2002 - Unique Constraint
      // ============================================================

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Tài khoản đang thực hiện giao dịch ở nơi khác');
      }

      // ============================================================
      // 11. Các lỗi khác
      // ============================================================

      throw error;
    }
  }

  // ============================================================
  // GENERATE TRANSACTION CODE
  // ============================================================

  private generateTransactionCode(): string {
    return `PTX_${Date.now()}_${crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()}`;
  }

  // ============================================================
  // CREATE MOMO PAYMENT
  // ============================================================

  private async createMomoPayment(data: {
    payment: any;
    transactionCode: string;
    amount: number;
  }) {
    const {payment, transactionCode, amount} = data;

    const accessKey = process.env.MOMO_ACCESS_KEY;

    const secretKey = process.env.MOMO_SECRET_KEY;

    const partnerCode = process.env.MOMO_PARTNER_CODE;

    const redirectUrl = process.env.MOMO_REDIRECT_URL;

    const ipnUrl = process.env.MOMO_IPN_URL;

    if (!accessKey || !secretKey || !partnerCode || !redirectUrl || !ipnUrl) {
      throw new InternalServerErrorException('Thiếu cấu hình MoMo');
    }

    // ============================================================
    // MoMo request
    // ============================================================

    const requestId = transactionCode;

    const orderId = transactionCode;

    const orderInfo = `Thanh toán hóa đơn ${payment.payment_order_code}`;

    const requestType = 'payWithATM';

    // ============================================================
    // Signature
    // ============================================================

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature =
      crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/create',
        {
          partnerCode,
          requestId,
          amount,
          orderId,
          orderInfo,
          redirectUrl,
          ipnUrl,
          requestType,
          extraData: '',
          signature,
          lang: 'vi',
        },
      );

      // console.log('MOMO RESPONSE:', response.data);

      const payUrl = response.data?.payUrl;

      if (!payUrl) {
        throw new InternalServerErrorException(
          'MoMo không trả về payUrl',
        );
      }

      return payUrl;
    } catch (error) {
      console.error(
        'MOMO ERROR:',
        axios.isAxiosError(error)
          ? error.response?.data
          : error,
      );

      throw new InternalServerErrorException(
        'Không thể tạo thanh toán MoMo',
      );
    }
  }
}

