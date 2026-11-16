import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { CreateCustomerModule } from '../customer-session/create_customer/create_customer.module';

@Module({
  imports: [CreateCustomerModule],
  controllers: [],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}