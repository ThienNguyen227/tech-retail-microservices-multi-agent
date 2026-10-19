import { Module } from '@nestjs/common';
import { LogoutAdminController } from './logout_admin.controller';
import { LogoutAdminService } from './logout_admin.service';

@Module({
  imports: [],
  controllers: [LogoutAdminController],
  providers: [LogoutAdminService],
  exports: [],
})
export class LogoutAdminModule {}