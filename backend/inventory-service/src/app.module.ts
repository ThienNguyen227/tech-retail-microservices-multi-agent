import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventories/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}