import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { PrismaModule } from './prisma/prisma.module';

import { OutboxModule } from './outbox/outbox.module';

import { OrderModule } from './orders/order.module';
import { GetOrderListModule } from './orders/get_order_list/get_order_list.module';
import { GetOrderModule } from './orders/get_order/get_order.module';
import { UpdateOrderStatusModule } from './orders/update_order_status/update_order_status.module';
import { CreateOrderModule } from './orders/create_order/create_order.module';
import { CancelOrderModule } from './orders/cancel_order/cancel_order.module';

@Module({
  imports: [
    // Scheduler
    ScheduleModule.forRoot(),

    // Prisma
    PrismaModule,

    // RabbitMQ
    RabbitMQModule,

    // Outbox
    OutboxModule,

    // Order
    OrderModule,
    GetOrderListModule,
    GetOrderModule,
    UpdateOrderStatusModule,
    CreateOrderModule,
    CancelOrderModule,
  ],

  controllers: [],

  providers: [],
})
export class AppModule {}