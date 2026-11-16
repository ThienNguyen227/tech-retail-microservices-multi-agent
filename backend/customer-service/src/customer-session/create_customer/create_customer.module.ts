import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { CreateCustomerService } from './create_customer.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [],
  providers: [
    CreateCustomerService,
  ],
  exports: [
    CreateCustomerService,
  ],
})
export class CreateCustomerModule {}