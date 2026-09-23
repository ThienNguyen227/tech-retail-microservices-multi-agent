import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/user.module';
import { RegisterModule } from './users/register/register.module';

@Module({
  imports: [PrismaModule, UsersModule, RegisterModule],
})
export class AppModule {}