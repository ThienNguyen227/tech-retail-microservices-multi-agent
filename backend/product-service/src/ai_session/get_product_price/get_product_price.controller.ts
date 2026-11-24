import { Controller, Get, Query } from '@nestjs/common';
import { GetProductPriceService } from './get_product_price.service';

@Controller('api/v1/ai/product-service')
export class GetProductPriceController {
  constructor(
    private readonly getProductPriceService: GetProductPriceService,
  ) {}

  @Get('prices')
  async getProductPrices(
    @Query('skus') skus: string | string[],
  ) {
    const normalizedSkus = Array.isArray(skus)
      ? skus
      : skus
        ? [skus]
        : [];

    return this.getProductPriceService.getProductPrices(
      normalizedSkus,
    );
  }
}