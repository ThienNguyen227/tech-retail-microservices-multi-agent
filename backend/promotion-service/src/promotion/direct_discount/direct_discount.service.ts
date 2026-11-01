import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DirectDiscountService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (GET) DIRECT DISCOUNT BY SKU -> DETAIL PRODUCT PAGE
  async getDirectDiscount(sku: string) {
    if (!sku) {
      throw new BadRequestException('SKU is required');
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

    return this.mapPromotion(promotionSKU);
  }

  // 2. (POST) GET DIRECT DISCOUNTS BY MULTIPLE SKUS -> PRODUCT LIST PAGE
  async getDirectDiscounts(skus: string[]) {
    if (!Array.isArray(skus) || skus.length === 0) {
      throw new BadRequestException('At least one SKU is required');
    }

    const uniqueSkus = [...new Set(skus)];

    const promotionSKUs = await this.prisma.promotionSKU.findMany({
      where: {
        promotion_sku_sku: {
          in: uniqueSkus,
        },
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

    // Trả về [] nếu không SKU nào có khuyến mãi.
    // SKU không có khuyến mãi sẽ không xuất hiện trong mảng.
    return promotionSKUs.map((promotionSKU) =>
      this.mapPromotion(promotionSKU),
    );
  }

  private mapPromotion(promotionSKU: any) {
    return {
      promotionId: promotionSKU.promotion.promotion_id,
      promotionName: promotionSKU.promotion.promotion_name,
      sku: promotionSKU.promotion_sku_sku,
      discountType:promotionSKU.promotion_discount_type.promotion_discount_type_code,
      discountValue: promotionSKU.promotion_sku_discount_value,
    };
  }
}