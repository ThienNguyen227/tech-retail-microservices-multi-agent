import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreateOrderController } from './create_order.controller';
import { CreateOrderService } from './create_order.service';

@Module({
  imports: [PrismaModule],
  controllers: [CreateOrderController],
  providers: [CreateOrderService],
  exports: [],
})
export class CreateOrderModule {}