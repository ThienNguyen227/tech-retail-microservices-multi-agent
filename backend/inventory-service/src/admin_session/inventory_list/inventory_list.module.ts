import { Module } from '@nestjs/common';

import { InventoryListController } from './inventory_list.controller';
import { InventoryListService } from './inventory_list.service';

@Module({
  imports: [],
  controllers: [InventoryListController],
  providers: [InventoryListService],
  exports: [InventoryListService],
})
export class InventoryListModule {}