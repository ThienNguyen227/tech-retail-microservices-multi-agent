import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BranchModule } from './branches/branch.module';

import { BranchAddressModule } from './ai_session/branch_address/branch_address.module';

@Module({
  imports: [PrismaModule, BranchModule, BranchAddressModule],
  controllers: [],
  providers: [],
})
export class AppModule {}