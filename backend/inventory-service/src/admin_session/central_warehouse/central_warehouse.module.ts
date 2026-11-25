import { Module } from '@nestjs/common';

import { CentralWarehouseController } from './central_warehouse.controller';
import { CentralWarehouseService } from './central_warehouse.service';

@Module({
  imports: [],
  controllers: [CentralWarehouseController],
  providers: [CentralWarehouseService],
  exports: [CentralWarehouseService],
})
export class CentralWarehouseModule {}
