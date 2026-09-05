import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { EmailService } from './email.service';
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UsersService, EmailService, JwtAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}