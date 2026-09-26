import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DirectDiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async getDirectDiscount(sku: string) 
  {
    if (!sku) {
      throw new BadRequestException(
        'SKU is required',
      );
    }

    const promotionSKU = await this.prisma.promotionSKU.findFirst({
        where: {
          promotion_sku_sku: sku,

          promotion: {
            promotion_type: {
              promotion_type_code: 'DIRECT_DISCOUNT',
            },

            promotion_status: {
              promotion_status_code: 'ACTIVE',
            },
          },
        },

        include: {
          promotion: true,
          promotion_discount_type: true,
        },
      });

    if (!promotionSKU) {
      throw new NotFoundException(
        `No active direct discount found for SKU: ${sku}`,
      );
    }

    return {
      promotionId: promotionSKU.promotion.promotion_id,

      promotionName: promotionSKU.promotion.promotion_name,

      sku: promotionSKU.promotion_sku_sku,

      discountType: promotionSKU.promotion_discount_type.promotion_discount_type_code,

      discountValue: promotionSKU.promotion_sku_discount_value,
    };
  }
}