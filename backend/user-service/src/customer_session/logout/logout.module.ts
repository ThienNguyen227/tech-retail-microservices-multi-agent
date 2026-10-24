import { Module } from '@nestjs/common';
import { LogoutCustomerController } from './logout.controller';
import { LogoutCustomerService } from './logout.service';

@Module({
  imports: [],
  controllers: [LogoutCustomerController],
  providers: [LogoutCustomerService],
  exports: [],
})
export class LogoutCustomerModule {}