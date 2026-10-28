import { Module } from '@nestjs/common';

import { CustomerListController } from './customer_list.controller';
import { CustomerListService } from './customer_list.service';

@Module({
  imports: [],
  controllers: [CustomerListController],
  providers: [CustomerListService],
})
export class CustomerListModule {}