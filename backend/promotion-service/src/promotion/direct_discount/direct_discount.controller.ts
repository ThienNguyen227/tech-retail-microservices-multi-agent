import {Controller, Get, Query, Post, Body} from '@nestjs/common';

import { GetDirectDiscountDto, GetDirectDiscountsDto } from '../dto/get-direct-discount.dto';

import { DirectDiscountService } from './direct_discount.service';

@Controller('api/v1/customer-session/promotion-service')
export class DirectDiscountController {
  constructor(private readonly directDiscountService: DirectDiscountService) {}

  // 1. (GET) DIRECT DISCOUNT BY SKU -> DETAIL-PRODUCT PAGE
  @Get('direct-discount')
  getDirectDiscount(@Query() dto: GetDirectDiscountDto) {
    return this.directDiscountService.getDirectDiscount(dto.sku);
  }

  // 2. (POST) GET DIRECT DISCOUNTS BY MULTIPLE SKUS -> PRODUCT-LIST PAGE
  @Post('direct-discounts')
  getDirectDiscounts(@Body() dto: GetDirectDiscountsDto) {
    return this.directDiscountService.getDirectDiscounts(dto.skus);
  }
}