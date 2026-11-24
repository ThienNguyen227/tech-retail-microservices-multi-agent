
import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import {
  CalculateFinalPriceService,
  CalculateFinalPriceItem,
} from './calculate_final_price.service';

@Controller('api/v1/ai/order-service')
export class CalculateFinalPriceController {
  constructor(
    private readonly calculateFinalPriceService: CalculateFinalPriceService,
  ) {}

  // ==========================================
  // 1. (POST) CALCULATE FINAL PRICE BY SKU + QUANTITY
  // ==========================================

  @Post('calculate-final-price')
  async calculateFinalPrice(
    @Body('items') items: CalculateFinalPriceItem[],
  ) {
    return this.calculateFinalPriceService.calculateFinalPrice(
      items,
    );
  }
}
