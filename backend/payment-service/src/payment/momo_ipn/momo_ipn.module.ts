import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';

import { MomoIpnController } from './momo_ipn.controller';
import { MomoIpnService } from './momo_ipn.service';

@Module({
  imports: [
    PrismaModule,
    RabbitMQModule,
  ],
  controllers: [MomoIpnController],
  providers: [MomoIpnService],
})
export class MomoIpnModule {}