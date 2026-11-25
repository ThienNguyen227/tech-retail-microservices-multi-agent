import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventories/inventory.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RestoreModule } from './inventories/restore/restore.module';

import { InventoryListModule } from './admin_session/inventory_list/inventory_list.module';
import { Warehouse1Module } from './admin_session/warehouse_1/warehouse_1.module';

@Module({
  imports: [
    PrismaModule, 
    InventoryModule, 
    RabbitMQModule, 
    RestoreModule,

    // ADMIN-SESSION
    InventoryListModule,
    Warehouse1Module,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}