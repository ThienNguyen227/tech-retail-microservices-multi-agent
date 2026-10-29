import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { GetWarrantyModule } from './customer_session/get_warranty/get_warranty.module';
import { WarrantyListModule } from './admin_sesion/warranty_list/warranty_list.module';
@Module({
  imports: [
    PrismaModule, 
    RabbitMQModule,

    // CUSTOMER - SESSION
    GetWarrantyModule,

    // ADMIN - SESSION
    WarrantyListModule


  ],
})
export class AppModule {}