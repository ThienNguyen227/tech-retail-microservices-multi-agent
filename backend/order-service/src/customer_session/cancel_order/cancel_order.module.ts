import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { CancelOrderController } from './cancel_order.controller';
import { CancelOrderService } from './cancel_order.service';

@Module({
  imports: [PrismaModule, RabbitMQModule],
  controllers: [CancelOrderController],
  providers: [CancelOrderService],
})
export class CancelOrderModule {}