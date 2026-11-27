import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

// CUSTOMER - SESSION
import { CustomerInformationModule } from './customer-session/customer_information/customer_information.module';
import { CustomerAddressModule } from './customer-session/customer_address/customer_address.module';
import { CreateCustomerModule } from './customer-session/create_customer/create_customer.module';

// AI SESSION
import { SearchCustomerModule } from './ai_session/search_customer/search_customer.module';

// ADMIN SESSION
import { CustomerListModule } from './admin_session/customer_list/customer_list.module';

@Module({
  imports: [
    //
    PrismaModule,
    RabbitMQModule,

    // ADMIN SESION
    CustomerListModule,

    // AI SESSION
    SearchCustomerModule,

    // CUSTOMER - SESSION
    CustomerInformationModule,
    CustomerAddressModule,
    CreateCustomerModule,
  ],
})
export class AppModule {}