import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DirectDiscountController } from './direct_discount.controller';
import { DirectDiscountService } from './direct_discount.service';

@Module({
  imports: [PrismaModule],
  controllers: [DirectDiscountController],
  providers: [DirectDiscountService],
  exports: [],
})
export class DirectDiscountModule {}