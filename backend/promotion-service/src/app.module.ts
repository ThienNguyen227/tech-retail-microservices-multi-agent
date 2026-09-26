import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {ThrottlerGuard, ThrottlerModule} from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { DirectDiscountModule } from './promotion/direct_discount/direct_discount.module';
import { CouponModule } from './promotion/coupon/coupon.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // Reset: 60 giây
        limit: 60,   // Limit: 60 requests 
      },
    ]),

    PrismaModule,
    DirectDiscountModule,
    CouponModule,
  ],

  controllers: [],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}