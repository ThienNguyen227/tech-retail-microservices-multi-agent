import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { SearchCustomerController } from './search_customer.controller';
import { SearchCustomerService } from './search_customer.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    SearchCustomerController,
  ],

  providers: [
    SearchCustomerService,
  ],

  exports: [
    SearchCustomerService,
  ],
})
export class SearchCustomerModule {}