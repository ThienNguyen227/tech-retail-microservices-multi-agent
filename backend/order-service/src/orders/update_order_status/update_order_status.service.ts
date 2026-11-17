import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface PaymentSucceededEventData {
  orderId: number;
}

@Injectable()
export class UpdateOrderStatusService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // async markAsPaid(orderId: number) {
  //   // 1. Kiểm tra Order tồn tại
  //   const order = await this.prisma.order.findUnique({
  //     where: {
  //       order_id: orderId,
  //     },
  //   });

  //   if (!order) {
  //     throw new NotFoundException(
  //       `Không tìm thấy Order: ${orderId}`,
  //     );
  //   }

  //   // 2. Cập nhật Payment Status -> PAID
  //   const updatedOrder =
  //     await this.prisma.order.update({
  //       where: {
  //         order_id: orderId,
  //       },

  //       data: {
  //         order_order_payment_status_id: 2,
  //       },
  //     });

  //   return updatedOrder;
  // }

  async markAsPaid(
    eventId: number,
    eventType: string,
    data: PaymentSucceededEventData,
  ) {
    // ======================================================
    // 1. VALIDATE EVENT
    // ======================================================

    if (
      !Number.isInteger(eventId) ||
      eventId <= 0
    ) {
      throw new BadRequestException(
        'Event ID không hợp lệ!',
      );
    }

    if (eventType !== 'payment.succeeded') {
      throw new BadRequestException(
        'Event type không hợp lệ!',
      );
    }

    if (
      !data ||
      !Number.isInteger(data.orderId) ||
      data.orderId <= 0
    ) {
      throw new BadRequestException(
        'Order ID không hợp lệ!',
      );
    }

    // ======================================================
    // 2. DATABASE TRANSACTION
    // ======================================================

    return await this.prisma.$transaction(
      async (tx) => {

        // ======================================================
        // 2.1. KIỂM TRA EVENT ĐÃ XỬ LÝ CHƯA
        // ======================================================

        const processedEvent =
          await tx.processedEvent.findUnique({
            where: {
              processed_event_event_id: eventId,
            },
            select: {
              processed_event_id: true,
            },
          });

        if (processedEvent) {
          return {
            success: true,
            alreadyProcessed: true,
            message: 'Event đã được xử lý trước đó!',
          };
        }

        // ======================================================
        // 2.2. KIỂM TRA ORDER TỒN TẠI
        // ======================================================

        const order = await tx.order.findUnique({
          where: {
            order_id: data.orderId,
          },
        });

        if (!order) {
          throw new NotFoundException(
            `Không tìm thấy Order: ${data.orderId}`,
          );
        }

        // ======================================================
        // 2.3. CẬP NHẬT PAYMENT STATUS -> PAID
        // ======================================================

        const updatedOrder =
          await tx.order.update({
            where: {
              order_id: data.orderId,
            },
            data: {
              order_order_payment_status_id: 2,
            },
          });

        // ======================================================
        // 2.4. GHI NHẬN EVENT ĐÃ XỬ LÝ
        // ======================================================

        await tx.processedEvent.create({
          data: {
            processed_event_event_id: eventId,
            processed_event_event_type: eventType,
          },
        });

        // ======================================================
        // 2.5. TRANSACTION COMMIT
        // ======================================================

        return {
          success: true,
          alreadyProcessed: false,
          message: 'Cập nhật trạng thái thanh toán thành công!',
          data: updatedOrder,
        };
      },
    );
  }
}
