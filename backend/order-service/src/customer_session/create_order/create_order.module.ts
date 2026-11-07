import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreateOrderController } from './create_order.controller';
import { CreateOrderService } from './create_order.service';

@Module({
  imports: [
    PrismaModule,
    // Đăng ký kết nối gRPC tới inventory-service
    ClientsModule.register([
      {
        name: 'INVENTORY_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'inventory',
          protoPath: join(__dirname, '../../proto/inventory.proto'),
          url: 'localhost:50051',
          loader: {
            keepCase: true,
          },
        },
      },
    ]),
  ],
  controllers: [CreateOrderController],
  providers: [CreateOrderService],
})
export class CreateOrderModule {}