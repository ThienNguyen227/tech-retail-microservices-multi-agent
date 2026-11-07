import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CancelOrderService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (PATCH) CANCEL-ORDER
  async cancelOrder(userId: string, orderId: number) {
    try {
      // 1. Tìm đơn hàng
      const order = await this.prisma.order.findUnique({
        where: {
          order_id: orderId,
        },
        include: {
          order_item: true,
        },
      });

      if (!order) {
        throw new BadRequestException(
          `Không tìm thấy đơn hàng ${orderId}`,
        );
      }

      // 2. Kiểm tra đơn hàng thuộc về người dùng
      if (order.order_user_id !== Number(userId)) {
        throw new BadRequestException(
          'Bạn không có quyền hủy đơn hàng này',
        );
      }

      // 3. Chỉ cho phép hủy khi đang chờ xác nhận
      if (order.order_order_processing_status_id !== 1) {
        throw new BadRequestException(
          'Chỉ có thể hủy đơn hàng khi đơn hàng đang chờ xác nhận',
        );
      }

      // 4. Cập nhật trạng thái và tạo Outbox Event
      const cancelledOrder = await this.prisma.$transaction(
        async (tx) => {
          const updatedOrder = await tx.order.update({
            where: {
              order_id: orderId,
            },
            data: {
              order_order_processing_status_id: 8,
            },
            include: {
              order_item: true,
            },
          });

          await tx.outboxEvent.create({
            data: {
              outbox_event_type: 'order.cancelled',
              outbox_event_payload: {
                orderId: updatedOrder.order_id,
                items: updatedOrder.order_item.map((item) => ({
                  sku: item.order_item_sku,
                  quantity: item.order_item_quantity,
                  serialNumber: item.order_item_serial_number,
                })),
              },
            },
          });

          return updatedOrder;
        },
      );

      return {
        success: true,
        message: 'Hủy đơn hàng thành công',
        data: cancelledOrder,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('CANCEL ORDER ERROR:', error);

      throw new InternalServerErrorException(
        'Không thể hủy đơn hàng',
      );
    }
  }
}