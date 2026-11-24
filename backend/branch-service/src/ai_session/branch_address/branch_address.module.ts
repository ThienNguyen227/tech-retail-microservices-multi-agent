import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { BranchAddressController } from './branch_address.controller';
import { BranchAddressService } from './branch_address.service';

@Module({
  imports: [PrismaModule],

  controllers: [
    BranchAddressController,
  ],

  providers: [
    BranchAddressService,
  ],

  exports: [
    BranchAddressService,
  ],
})
export class BranchAddressModule {}