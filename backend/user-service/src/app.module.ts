import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/user.module';
// import { RegisterModule } from './users/register/register.module';
import { RegisterModule } from './customer_session/register/register.module';
import { ForgotPasswordModule } from './customer_session/forgot_password/forgot_password.module';

@Module({
  imports: [PrismaModule, RedisModule, UsersModule, RegisterModule, ForgotPasswordModule],
})
export class AppModule {}