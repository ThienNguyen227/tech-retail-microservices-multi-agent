import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

import { OutboxService } from './outbox.service';
import { OutboxWorker } from './outbox.worker';

@Module({
  imports: [
    PrismaModule,
    RabbitMQModule,
  ],
  providers: [
    OutboxService,
    OutboxWorker,
  ],
  exports: [
    OutboxService,
  ],
})
export class OutboxModule {}
