import { Controller, Get } from '@nestjs/common';
import { PromotionListService } from './promotion_list.service';

@Controller('api/v1/customer-session/promotion-service')
export class PromotionListController {
    constructor(private readonly promotionListService: PromotionListService) {}

    // 1. (GET) PROMOTION LIST
    @Get('promotion-list')
    getAllPromotions() {
        return this.promotionListService.getAllPromotions();
    }
}