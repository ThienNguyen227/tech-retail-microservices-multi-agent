import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GetOrderController } from './get_order.controller';
import { GetOrderService } from './get_order.service';

@Module({
  imports: [PrismaModule],
  controllers: [GetOrderController],
  providers: [GetOrderService],
  exports: [],
})
export class GetOrderModule {}