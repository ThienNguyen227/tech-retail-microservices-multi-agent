import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventories/inventory.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RestoreModule } from './inventories/restore/restore.module';

@Module({
  imports: [PrismaModule, InventoryModule, RabbitMQModule, RestoreModule],
  controllers: [],
  providers: [],
})
export class AppModule {}