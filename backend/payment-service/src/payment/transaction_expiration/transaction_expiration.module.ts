
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { TransactionExpirationService } from './transaction_expiration.service';

@Module({
  imports: [PrismaModule],
  providers: [TransactionExpirationService],
})
export class TransactionExpirationModule {}
