import { Module } from '@nestjs/common';
import { LoginAdminController } from './login_admin.controller';
import { LoginAdminService } from './login_admin.service';

@Module({
  imports: [],
  controllers: [LoginAdminController],
  providers: [LoginAdminService],
  exports: [],
})
export class LoginAdminModule {}