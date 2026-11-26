import { Module } from '@nestjs/common';

import { UpdateWarrantyRequestController } from './update_warranty_request.controller';
import { UpdateWarrantyRequestService } from './update_warranty_request.service';

@Module({
  imports: [],
  controllers: [UpdateWarrantyRequestController],
  providers: [UpdateWarrantyRequestService],
  exports: [],
})
export class UpdateWarrantyRequestModule {}