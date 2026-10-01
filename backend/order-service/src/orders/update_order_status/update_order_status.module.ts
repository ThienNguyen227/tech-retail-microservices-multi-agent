import { Module } from '@nestjs/common';
import { UpdateOrderStatusService } from './update_order_status.service';

@Module({
  imports: [],
  controllers: [],
  providers: [UpdateOrderStatusService],
  exports: [UpdateOrderStatusService],
})
export class UpdateOrderStatusModule {}