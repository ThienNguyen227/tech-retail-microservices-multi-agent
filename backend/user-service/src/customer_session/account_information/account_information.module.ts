import { Module } from '@nestjs/common';
import { AccountInformationController } from './account_information.controller';
import { AccountInformationService } from './account_information.service';

@Module({
  imports: [],
  controllers: [AccountInformationController],
  providers: [AccountInformationService],
  exports: [],
})
export class AccountInformationModule {}