import { Module } from '@nestjs/common';
// import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';

import { ForgotPasswordController } from './forgot_password.controller';
import { ForgotPasswordService } from './forgot_password.service';

@Module({
  imports: [EmailModule],
  controllers: [ForgotPasswordController],
  providers: [ForgotPasswordService],
  exports: [],
})
export class ForgotPasswordModule {}