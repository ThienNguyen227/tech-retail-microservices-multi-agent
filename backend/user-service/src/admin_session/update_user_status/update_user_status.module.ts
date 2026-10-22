import { Module } from '@nestjs/common';
import { UpdateUserStatusController } from './update_user_status.controller';
import { UpdateUserStatusService } from './update_user_status.service';

@Module({
  imports: [],
  controllers: [UpdateUserStatusController],
  providers: [UpdateUserStatusService],
  exports: [],
})
export class UpdateUserStatusModule {}