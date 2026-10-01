import { Module } from '@nestjs/common';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

import { PrismaModule } from './prisma/prisma.module';

import { OrderModule } from './orders/order.module';
import { GetOrderListModule } from './orders/get_order_list/get_order_list.module';
import { GetOrderModule } from './orders/get_order/get_order.module';
import { UpdateOrderStatusModule } from './orders/update_order_status/update_order_status.module';

@Module({
  imports: [
    // Prisma
    PrismaModule,

    // RabbitMQ
    RabbitMQModule,

    // Order
    OrderModule,
    GetOrderListModule,
    GetOrderModule,
    UpdateOrderStatusModule,
  ],

  controllers: [],

  providers: [],
})
export class AppModule {}

