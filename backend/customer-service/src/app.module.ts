import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CustomerModule } from './customer/customer.module';

// CUSTOMER - SESSION
import { CustomerInformationModule } from './customer-session/customer_information/customer_information.module';
import { CustomerAddressModule } from './customer-session/customer_address/customer_address.module';

@Module({
  imports: [
    PrismaModule, 
    CustomerModule,

    // CUSTOMER - SESSION
    CustomerInformationModule,
    CustomerAddressModule,
  ],
})
export class AppModule {}