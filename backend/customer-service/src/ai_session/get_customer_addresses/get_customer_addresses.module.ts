import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { GetCustomerAddressesController } from './get_customer_addresses.controller';
import { GetCustomerAddressesService } from './get_customer_addresses.service';

@Module({
  imports: [PrismaModule],
  controllers: [GetCustomerAddressesController],
  providers: [GetCustomerAddressesService],
  exports: [GetCustomerAddressesService],
})
// Module API riêng dành cho tool get_customer_addresses.
export class GetCustomerAddressesModule {}
