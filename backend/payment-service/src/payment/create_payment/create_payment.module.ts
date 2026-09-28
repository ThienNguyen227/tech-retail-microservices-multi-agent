import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreatePaymentController } from './create_payment.controller';
import { CreatePaymentService } from './create_payment.service';

@Module({
  imports: [PrismaModule],
  controllers: [CreatePaymentController],
  providers: [CreatePaymentService],
  exports: [],
})
export class CreatePaymentModule {}