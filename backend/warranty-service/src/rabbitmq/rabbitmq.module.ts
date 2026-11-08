import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { CreateWarrantyModule } from '../customer_session/create_warranty/create_warranty.module';


@Module({
  imports: [CreateWarrantyModule],
  controllers: [],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}