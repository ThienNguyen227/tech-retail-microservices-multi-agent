import { Module } from '@nestjs/common';
import { CreateWarrantyRequestController } from './create_warranty_request.controller';
import { CreateWarrantyRequestService } from './create_warranty_request.service';

@Module({
  imports: [],
  controllers: [CreateWarrantyRequestController],
  providers: [CreateWarrantyRequestService],
  exports: [],
})
export class CreateWarrantyRequestModule {}