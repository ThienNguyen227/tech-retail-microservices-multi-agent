import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RestoreModule } from '../inventories/restore/restore.module';

@Module({
  imports: [RestoreModule],
  controllers: [],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}