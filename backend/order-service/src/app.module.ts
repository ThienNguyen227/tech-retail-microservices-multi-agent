import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { PrismaModule } from './prisma/prisma.module';

import { OutboxModule } from './outbox/outbox.module';

import { GetOrderListModule } from './customer_session/get_order_list/get_order_list.module';
import { GetOrderModule } from './orders/get_order/get_order.module';
import { UpdateOrderStatusModule } from './orders/update_order_status/update_order_status.module';
import { CreateOrderModule } from './customer_session/create_order/create_order.module';
import { CancelOrderModule } from './customer_session/cancel_order/cancel_order.module';

// ADMIN-SESSION
import { OrderListModule } from './admin_session/order_list/order_list.module';
import { OrderProcessingStatusModule } from './admin_session/order_processing_status/order_processing_status.module';

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
    GetOrderListModule,
    GetOrderModule,
    UpdateOrderStatusModule,
    CreateOrderModule,
    CancelOrderModule,


    // ADMIN-SESSIO
    OrderListModule,
    OrderProcessingStatusModule,

  ],

  controllers: [],

  providers: [],
})
export class AppModule {}