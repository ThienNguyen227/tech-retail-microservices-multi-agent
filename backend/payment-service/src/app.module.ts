import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CreatePaymentModule } from './payment/create_payment/create_payment.module';

@Module({
  imports: [PrismaModule, CreatePaymentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}