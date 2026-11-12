import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromotionListService {
    constructor(private readonly prisma: PrismaService) {}

    // 1. (GET) PROMOTION LIST
    async getAllPromotions() {
        const now = new Date();

        const promotions = await this.prisma.promotion.findMany({
            select: {
                promotion_id: true,
                promotion_name: true,
                promotion_description: true,
                promotion_start_at: true,
                promotion_end_at: true,
                promotion_created_at: true,
                promotion_status_id: true,
            },
            where: {
                promotion_status_id: 3,
                promotion_start_at: {
                    lte: now,
                },
                promotion_end_at: {
                    gte: now,
                },
            },
            orderBy: {
                promotion_created_at: 'desc',
            },
        });

        return promotions.map((promotion) => ({
            promotionId: promotion.promotion_id,
            promotionName: promotion.promotion_name,
            promotionDescription: promotion.promotion_description,
            promotionStartAt: promotion.promotion_start_at,
            promotionEndAt: promotion.promotion_end_at,
            promotionCreatedAt: promotion.promotion_created_at,
            promotionStatusId: promotion.promotion_status_id,
        }));
    }
}