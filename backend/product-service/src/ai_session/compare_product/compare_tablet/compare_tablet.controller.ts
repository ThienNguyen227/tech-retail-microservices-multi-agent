import { Controller, Get, Query } from '@nestjs/common';
import { CompareTabletService } from './compare_tablet.service';

@Controller('api/v1/ai/product-service')
export class CompareTabletController {
  constructor(
    private readonly compareTabletService: CompareTabletService,
  ) {}

  @Get('compare/tablets')
  async compareTablets(@Query('products') products: string | string[], @Query('criteria') criteria?: string | string[]) {
    const normalizedProducts = Array.isArray(products) ? products : products ? [products] : [];

    const normalizedCriteria = criteria === undefined ? undefined : Array.isArray(criteria) ? criteria : [criteria];

    return this.compareTabletService.compareTablets(normalizedProducts, normalizedCriteria);
  }
}