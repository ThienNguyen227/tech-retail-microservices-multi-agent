import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
// import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';

@Injectable()
export class CancelOrderService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly rabbitMQService: RabbitMQService,
  ) {}

  async cancelOrder(orderId: number) {
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

      // 2. Chỉ cho phép hủy khi "Chờ xác nhận"
      if (order.order_order_processing_status_id !== 1) {
        throw new BadRequestException(
          'Chỉ có thể hủy đơn hàng khi đơn hàng đang chờ xác nhận',
        );
      }

      const cancelledOrder = await this.prisma.$transaction(async (tx) => {
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
    });


      // 3. Cập nhật trạng thái đơn hàng -> Đã hủy
      // const cancelledOrder = await this.prisma.order.update({
      //   where: {
      //     order_id: orderId,
      //   },
      //   data: {
      //     order_order_processing_status_id: 8,
      //   },
      //   include: {
      //     order_item: true,
      //   },
      // });

      // 4. Publish event order.cancelled
      // await this.rabbitMQService.publish(
      //   'order.cancelled',
      //   {
      //     items: cancelledOrder.order_item.map((item) => ({
      //       sku: item.order_item_sku,
      //       quantity: item.order_item_quantity,
      //       serialNumber: item.order_item_serial_number,
      //     })),
      //   },
      // );

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