import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GetOrderListController } from './get_order_list.controller';
import { GetOrderListService } from './get_order_list.service';

@Module({
  imports: [PrismaModule],
  controllers: [GetOrderListController],
  providers: [GetOrderListService],
  exports: [],
})
export class GetOrderListModule {}