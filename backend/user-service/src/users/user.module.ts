import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { EmailService } from './email.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UsersService, EmailService],
  exports: [UsersService],
})
export class UsersModule {}