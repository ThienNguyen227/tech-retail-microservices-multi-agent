import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { OrderModule } from './orders/order.module';
import { GetOrderListModule } from './orders/get_order_list/get_order_list.module';

@Module({
  imports: [PrismaModule, OrderModule, GetOrderListModule],
  controllers: [],
  providers: [],
})
export class AppModule {}