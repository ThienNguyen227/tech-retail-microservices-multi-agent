import { Module } from '@nestjs/common';
import { EmailModule } from '../../email/email.module';

import { LoginController } from './login.controller';
import { LoginService } from './login.service';

@Module({
  imports: [EmailModule],
  controllers: [LoginController],
  providers: [LoginService],
  exports: [],
})
export class LoginModule {}