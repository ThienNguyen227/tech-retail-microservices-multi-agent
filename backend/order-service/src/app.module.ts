import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { OrderModule } from './orders/order.module';
import { GetOrderListModule } from './orders/get_order_list/get_order_list.module';
import { GetOrderModule } from './orders/get_order/get_order.module';

@Module({
  imports: [PrismaModule, OrderModule, GetOrderListModule, GetOrderModule],
  controllers: [],
  providers: [],
})
export class AppModule {}