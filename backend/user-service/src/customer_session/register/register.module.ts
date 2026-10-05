import { Module } from '@nestjs/common';
// import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';

import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';

@Module({
  imports: [EmailModule],
  controllers: [RegisterController],
  providers: [RegisterService],
  exports: [],
})
export class RegisterModule {}