import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { GetWarrantyModule } from './customer-session/get_warranty/get_warranty.module';

@Module({
  imports: [
    PrismaModule, 
    RabbitMQModule,

    // CUSTOMER - SESSION
    GetWarrantyModule,

  ],
})
export class AppModule {}