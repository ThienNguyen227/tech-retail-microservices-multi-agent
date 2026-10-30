import { Module } from '@nestjs/common';
import { WarrantyListController } from './warranty_list.controller';
import { WarrantyListService } from './warranty_list.service';

@Module({
  imports: [],
  controllers: [WarrantyListController],
  providers: [WarrantyListService],
  exports: [WarrantyListService],
})
export class WarrantyListModule {}