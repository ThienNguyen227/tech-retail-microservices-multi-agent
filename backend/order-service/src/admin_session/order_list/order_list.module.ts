
import { Module } from '@nestjs/common';

import { OrderListController } from './order_list.controller';
import { OrderListService } from './order_list.service';

@Module({
  imports: [],
  controllers: [OrderListController],
  providers: [OrderListService],
  exports: [OrderListService],
})
export class OrderListModule {}
