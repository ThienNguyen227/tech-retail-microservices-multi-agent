import {Controller, Get, Query} from '@nestjs/common';

import { GetDirectDiscountDto } from '../dto/get-direct-discount.dto';

import { DirectDiscountService } from './direct_discount.service';

@Controller('api/v1/promotion')
export class DirectDiscountController {
  constructor(private readonly directDiscountService: DirectDiscountService) {}

  @Get('direct-discount')
  getDirectDiscount(@Query() dto: GetDirectDiscountDto) {
    return this.directDiscountService.getDirectDiscount(dto.sku);
  }
}