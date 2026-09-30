import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionExpirationService {
  constructor(private readonly prisma: PrismaService) {}

  // @Cron('0 */2 * * * *')
  // async expirePendingTransactions() {
  //   console.log('CRON RUN:', new Date().toISOString());

  //   const expireBefore = new Date(Date.now() - 2 * 60 * 1000);

  //   console.log('Expire before:', expireBefore.toISOString());

  //   const pendingStatus =
  //     await this.prisma.paymentTransactionStatus.findUnique({
  //       where: {
  //         payment_transaction_status_code: 'PENDING',
  //       },
  //     });

  //   const expiredStatus =
  //     await this.prisma.paymentTransactionStatus.findUnique({
  //       where: {
  //         payment_transaction_status_code: 'EXPIRED',
  //       },
  //     });

  //   console.log('PENDING ID:', pendingStatus?.payment_transaction_status_id);
  //   console.log('EXPIRED ID:', expiredStatus?.payment_transaction_status_id);

  //   if (!pendingStatus || !expiredStatus) {
  //     console.log('Không tìm thấy status');
  //     return;
  //   }

  //   const result = await this.prisma.paymentTransaction.updateMany({
  //     where: {
  //       payment_transaction_status_id:
  //         pendingStatus.payment_transaction_status_id,

  //       payment_transaction_created_at: {
  //         lt: expireBefore,
  //       },
  //     },

  //     data: {
  //       payment_transaction_status_id:
  //         expiredStatus.payment_transaction_status_id,
  //     },
  //   });

  //   console.log(`EXPIRED: ${result.count} transaction(s)`);
  // }
}