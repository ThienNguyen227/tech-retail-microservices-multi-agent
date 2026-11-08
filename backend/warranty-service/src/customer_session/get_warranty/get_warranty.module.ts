import { Module } from '@nestjs/common';
import { GetWarrantyController } from './get_warranty.controller';
import { GetWarrantyService } from './get_warranty.service';

@Module({
  imports: [],
  controllers: [GetWarrantyController],
  providers: [GetWarrantyService],
  exports: [],
})
export class GetWarrantyModule {}