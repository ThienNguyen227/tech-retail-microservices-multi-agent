import { Module } from '@nestjs/common';
import { CreateWarrantyService } from './create_warranty.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CreateWarrantyService],
  exports: [CreateWarrantyService],
})
export class CreateWarrantyModule {}