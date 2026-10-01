import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';

import { CreatePaymentModule } from './payment/create_payment/create_payment.module';
import { MomoIpnModule } from './payment/momo_ipn/momo_ipn.module';
import { TransactionExpirationModule } from './payment/transaction_expiration/transaction_expiration.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    // Cron Job
    ScheduleModule.forRoot(),

    // Prisma
    PrismaModule,

    // RabbitMQ
    RabbitMQModule,

    // Payment
    CreatePaymentModule,
    MomoIpnModule,
    TransactionExpirationModule,
  ],

  controllers: [],

  providers: [],
})
export class AppModule {}

