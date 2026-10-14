import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetPhoneDetailService } from './get_phone_detail.service';

@Controller('api/v1/ai/product-service')
export class GetPhoneDetailController {
    constructor(private readonly getPhoneDetailService: GetPhoneDetailService) {}

    @Get('detail/phone')
    async getPhoneDetail(@Query('phoneName') phoneName: string, @Query('criteria') criteria?: string | string[]) {
        
        const normalizedCriteria = criteria === undefined ? undefined : Array.isArray(criteria) ? criteria : [criteria];

        return this.getPhoneDetailService.getPhoneDetail(phoneName, normalizedCriteria);
    }
}
