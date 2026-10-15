import { Controller, Get, Query } from '@nestjs/common';
import { ComparePhoneService } from './compare_phone.service';

@Controller('api/v1/ai/product-service')
export class ComparePhoneController {
  constructor(private readonly comparePhoneService: ComparePhoneService) {}

  @Get('compare/phones')
  async comparePhones(@Query('products') products: string | string[], @Query('criteria') criteria?: string | string[]) {
    const normalizedProducts = Array.isArray(products) ? products : products ? [products] : [];

    const normalizedCriteria = criteria === undefined ? undefined : Array.isArray(criteria) ? criteria : [criteria];

    return this.comparePhoneService.comparePhones(normalizedProducts, normalizedCriteria);
  }
}