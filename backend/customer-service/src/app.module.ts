import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

// CUSTOMER - SESSION
import { CustomerInformationModule } from './customer-session/customer_information/customer_information.module';
import { CustomerAddressModule } from './customer-session/customer_address/customer_address.module';

// AI SESSION
import { SearchCustomerModule } from './ai_session/search_customer/search_customer.module';
import { GetCustomerAddressesModule } from './ai_session/get_customer_addresses/get_customer_addresses.module';

// ADMIN SESSION
import { CustomerListModule } from './admin_session/customer_list/customer_list.module';

@Module({
  imports: [
    //
    PrismaModule,

    // ADMIN SESION
    CustomerListModule,

    // AI SESSION
    SearchCustomerModule,
    GetCustomerAddressesModule,

    // CUSTOMER - SESSION
    CustomerInformationModule,
    CustomerAddressModule,
  ],
})
export class AppModule {}