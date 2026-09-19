import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { OrderModule } from './orders/order.module';

@Module({
  imports: [PrismaModule, OrderModule],
  controllers: [],
  providers: [],
})
export class AppModule {}