import { Module } from '@nestjs/common';
import { CustomerInformationController } from './customer_information.controller';
import { CustomerInformationService } from './customer_information.service';

@Module({
  imports: [],
  controllers: [CustomerInformationController],
  providers: [CustomerInformationService],
  exports: [],
})
export class CustomerInformationModule {}