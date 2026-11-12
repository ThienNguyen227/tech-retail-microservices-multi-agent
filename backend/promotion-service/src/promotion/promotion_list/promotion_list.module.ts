import { Module } from '@nestjs/common';
import { PromotionListController } from './promotion_list.controller';
import { PromotionListService } from './promotion_list.service';

@Module({
    imports: [],
    controllers: [PromotionListController],
    providers: [PromotionListService],
    exports: [],
})
export class PromotionListModule {}