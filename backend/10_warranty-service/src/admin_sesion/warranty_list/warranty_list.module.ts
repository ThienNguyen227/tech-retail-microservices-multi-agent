import { Module } from '@nestjs/common';
import { WarrantyListService } from './warranty_list.service';

@Module({
  imports: [],
  controllers: [],
  providers: [WarrantyListService],
  exports: [WarrantyListService],
})
export class WarrantyListModule {}