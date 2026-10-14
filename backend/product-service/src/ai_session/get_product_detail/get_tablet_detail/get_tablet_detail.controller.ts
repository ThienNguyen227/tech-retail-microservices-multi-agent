import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetTabletDetailService } from './get_tablet_detail.service';

@Controller('api/v1/ai/product-service')
export class GetTabletDetailController {
    constructor(private readonly getTabletDetailService: GetTabletDetailService) {}

    @Get('detail/tablet')
    async getTabletDetail(@Query('tabletName') tabletName: string, @Query('criteria') criteria?: string | string[]) {
        const normalizedCriteria = criteria === undefined ? undefined : Array.isArray(criteria) ? criteria : [criteria];

        return this.getTabletDetailService.getTabletDetail(tabletName, normalizedCriteria);
    }

}