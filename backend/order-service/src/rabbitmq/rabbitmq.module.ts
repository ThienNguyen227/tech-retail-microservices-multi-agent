import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { UpdateOrderStatusService } from './../orders/update_order_status/update_order_status.service';

@Module({
  imports: [],
  controllers: [],
  providers: [RabbitMQService, UpdateOrderStatusService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}