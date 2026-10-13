import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompareProductService } from './compare_product.service';

@Controller('api/v1/ai/product-service')
export class CompareProductController {
  constructor(
    private readonly compareProductService: CompareProductService,
  ) {}

 @Get('compare/phones')
 async comparePhones(@Query('products') products: string[], @Query('criteria') criteria?: string[]) {
  return this.compareProductService.comparePhones(products, criteria);
 }
}
