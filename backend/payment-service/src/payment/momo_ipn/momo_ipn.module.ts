import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { MomoIpnController } from './momo_ipn.controller';
import { MomoIpnService } from './momo_ipn.service';

@Module({
  controllers: [MomoIpnController],
  providers: [MomoIpnService, PrismaService],
})
export class MomoIpnModule {}