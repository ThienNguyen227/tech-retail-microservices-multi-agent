import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BranchModule } from './branches/branch.module';

@Module({
  imports: [PrismaModule, BranchModule],
  controllers: [],
  providers: [],
})
export class AppModule {}