import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllCoupons() {
        const coupons = await this.prisma.promotionCoupon.findMany({
            select: {
                promotion_coupon_id: true,
                promotion_coupon_value: true,
                promotion_coupon_min_order_value: true,
                promotion_coupon_max_discount_value: true,

                promotion_discount_type: {
                    select: {
                        promotion_discount_type_code: true,
                    },
                } ,
            },
            where: {
                promotion: {
                    promotion_status: {
                        promotion_status_code: 'ACTIVE',
                    },
                    promotion_type: {
                        promotion_type_code: 'COUPON',
                    },
                },
            },
            orderBy: {
                promotion_coupon_id: 'desc',
            },
        });

        return coupons.map((coupon) => ({
            couponId: coupon.promotion_coupon_id,
            discountValue: coupon.promotion_coupon_value,
            minOrderValue: coupon.promotion_coupon_min_order_value,
            maxDiscountValue: coupon.promotion_coupon_max_discount_value,
            discountType: coupon.promotion_discount_type.promotion_discount_type_code,
        }));
    }
}