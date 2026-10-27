import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CustomerModule } from './customer/customer.module';

// AI SESSION
import { SearchCustomerModule } from './ai_session/search_customer/search_customer.module';
import { GetCustomerAddressesModule } from './ai_session/get_customer_addresses/get_customer_addresses.module';

@Module({
  imports: [
    PrismaModule,
    CustomerModule,

    // AI SESSION
    SearchCustomerModule,
    GetCustomerAddressesModule,
  ],
})
export class AppModule {}