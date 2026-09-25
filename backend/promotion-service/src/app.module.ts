import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DirectDiscountModule } from './promotion/direct_discount/direct_discount.module';

@Module({
  imports: [PrismaModule, DirectDiscountModule],
  controllers: [],
  providers: [],
})
export class AppModule {}