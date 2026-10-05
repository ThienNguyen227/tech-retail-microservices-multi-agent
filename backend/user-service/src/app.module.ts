import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/user.module';
// import { RegisterModule } from './users/register/register.module';
import { RegisterModule } from './customer_session/register/register.module';

@Module({
  imports: [PrismaModule, RedisModule, UsersModule, RegisterModule],
})
export class AppModule {}