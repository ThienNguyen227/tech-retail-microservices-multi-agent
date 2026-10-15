import { Controller, Get, Query } from '@nestjs/common';
import { CompareLaptopService } from './compare_laptop.service';

@Controller('api/v1/ai/product-service')
export class CompareLaptopController {
  constructor(
    private readonly compareLaptopService: CompareLaptopService,
  ) {}

  @Get('compare/laptops')
  async compareLaptops(@Query('products') products: string | string[], @Query('criteria') criteria?: string | string[]) {
    const normalizedProducts = Array.isArray(products) ? products : products ? [products] : [];

    const normalizedCriteria = criteria === undefined ? undefined : Array.isArray(criteria) ? criteria : [criteria];

    return this.compareLaptopService.compareLaptops(normalizedProducts, normalizedCriteria);
  }
}