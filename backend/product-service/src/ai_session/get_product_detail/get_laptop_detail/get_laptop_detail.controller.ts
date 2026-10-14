import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetLaptopDetailService } from './get_laptop_detail.service';

@Controller('api/v1/ai/product-service')
export class GetLaptopDetailController {
    constructor(private readonly getLaptopDetailService: GetLaptopDetailService) {}

    @Get('detail/laptop')
    async getLaptopDetail(@Query('laptopName') laptopName: string, @Query('criteria') criteria?: string | string[]) {
        const normalizedCriteria = criteria === undefined ? undefined : Array.isArray(criteria) ? criteria : [criteria];

        return this.getLaptopDetailService.getLaptopDetail(laptopName, normalizedCriteria);
    }

}
