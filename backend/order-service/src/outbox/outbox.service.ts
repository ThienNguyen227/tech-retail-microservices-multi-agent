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

  async processPendingEvents() {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        outbox_event_status: 'PENDING',
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
        // await this.rabbitMQService.publish(
        //   event.outbox_event_type,
        //   event.outbox_event_payload,
        // );

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
}

