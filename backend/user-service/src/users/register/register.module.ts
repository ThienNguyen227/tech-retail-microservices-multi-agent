import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { RegisterRepository } from './register.repository';
import { EmailService } from '../email.service';

@Module({
  imports: [PrismaModule],
  controllers: [RegisterController],
  providers: [RegisterService, RegisterRepository, EmailService],
  exports: [],
})
export class RegisterModule {}