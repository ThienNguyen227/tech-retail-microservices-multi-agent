import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  // 1. (ORDER -> INVENTORY)
  async processPendingEventsFromOrderToInventory() {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        outbox_event_status: 'PENDING',
        outbox_event_type: 'order.cancelled',
      },
      orderBy: {
        outbox_event_created_at: 'asc',
      },
      take: 10,
    });

    for (const event of events) {

        
      try {
        const payload = {
            eventId: event.outbox_event_id,
            eventType: event.outbox_event_type,
            data: event.outbox_event_payload,
            };

            await this.rabbitMQService.publish(
            event.outbox_event_type,
            payload,
            );

        await this.prisma.outboxEvent.update({
          where: {
            outbox_event_id: event.outbox_event_id,
          },
          data: {
            outbox_event_status: 'PUBLISHED',
            outbox_event_published_at: new Date(),
          },
        });

        this.logger.log(
          `Outbox event ${event.outbox_event_id} published successfully`,
        );
      } catch (error) {
        await this.prisma.outboxEvent.update({
          where: {
            outbox_event_id: event.outbox_event_id,
          },
          data: {
            outbox_event_retry_count: {
              increment: 1,
            },
          },
        });

        this.logger.error(
          `Failed to publish outbox event ${event.outbox_event_id}`,
          error,
        );
      }
    }
  }

  // 2. (ORDER -> INVENTORY)
  async processPendingEventsFromOrderToWarranty() {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        outbox_event_status: 'PENDING',
        outbox_event_type: 'order.warranty.eligible',
      },
      orderBy: {
        outbox_event_created_at: 'asc',
      },
      take: 10,
    });

    for (const event of events) {
      try {
        const payload = {
          eventId: event.outbox_event_id,
          eventType: event.outbox_event_type,
          data: event.outbox_event_payload,
        };

        // Publish event từ Order sang Warranty
        await this.rabbitMQService.publish(
          event.outbox_event_type,
          payload,
        );

        // Đánh dấu event đã publish thành công
        await this.prisma.outboxEvent.update({
          where: {
            outbox_event_id: event.outbox_event_id,
          },
          data: {
            outbox_event_status: 'PUBLISHED',
            outbox_event_published_at: new Date(),
          },
        });

        this.logger.log(
          `Order -> Warranty: event ${event.outbox_event_id} published successfully`,
        );
      } catch (error) {
        // Tăng số lần retry nếu publish thất bại
        await this.prisma.outboxEvent.update({
          where: {
            outbox_event_id: event.outbox_event_id,
          },
          data: {
            outbox_event_retry_count: {
              increment: 1,
            },
          },
        });

        this.logger.error(
          `Order -> Warranty: failed to publish event ${event.outbox_event_id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
  
  // CHECK CONDITION FOR CREATION OF WARRANTY
  async checkEligibleOrders() {
    const orders = await this.prisma.order.findMany({
      where: {
        order_order_payment_status_id: 2,
        order_order_processing_status_id: 6,
      },
      include: {
        order_item: true,
      },
    });

    for (const order of orders) {
      try {
        // 1. Kiểm tra event bảo hành của đơn hàng đã tồn tại chưa
        const existingEvent = await this.prisma.outboxEvent.findFirst({
          where: {
            outbox_event_type: 'order.warranty.eligible',
            outbox_event_payload: {
              path: ['orderId'],
              equals: order.order_id,
            },
          },
        });

        if (existingEvent) {
          continue;
        }

        // 2. Tạo event vào Outbox
        const event = await this.prisma.outboxEvent.create({
          data: {
            outbox_event_type: 'order.warranty.eligible',
            outbox_event_payload: {
              orderId: order.order_id,
              orderCode: order.order_code,
              userId: order.order_user_id,
              items: order.order_item.map((item) => ({
                orderItemId: item.order_item_id,
                sku: item.order_item_sku,
                serialNumber: item.order_item_serial_number,
                productName: item.order_item_product_name,
                productImage: item.order_item_product_image,
                quantity: item.order_item_quantity,
              })),
            },
          },
        });

        this.logger.log(
          `Created warranty event ${event.outbox_event_id} for order ${order.order_code}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create warranty event for order ${order.order_code}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}

