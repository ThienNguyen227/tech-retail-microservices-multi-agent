import { Module } from '@nestjs/common';
import { CustomerAddressController } from './customer_address.controller';
import { CustomerAddressService } from './customer_address.service';

@Module({
  imports: [],
  controllers: [CustomerAddressController],
  providers: [CustomerAddressService],
  exports: [],
})
export class CustomerAddressModule {}