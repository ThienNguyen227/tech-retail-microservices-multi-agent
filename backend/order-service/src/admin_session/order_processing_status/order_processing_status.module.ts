
import { Module } from '@nestjs/common';

import { OrderProcessingStatusController } from './order_processing_status.controller';
import { OrderProcessingStatusService } from './order_processing_status.service';

@Module({
  imports: [],
  controllers: [OrderProcessingStatusController],
  providers: [OrderProcessingStatusService],
  exports: [OrderProcessingStatusService],
})
export class OrderProcessingStatusModule {}
