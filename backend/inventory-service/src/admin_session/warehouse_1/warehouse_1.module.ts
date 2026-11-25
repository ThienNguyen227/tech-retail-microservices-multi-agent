import { Module } from '@nestjs/common';

import { Warehouse1Controller } from './warehouse_1.controller';
import { Warehouse1Service } from './warehouse_1.service';

@Module({
  imports: [],
  controllers: [Warehouse1Controller],
  providers: [Warehouse1Service],
  exports: [Warehouse1Service],
})
export class Warehouse1Module {}