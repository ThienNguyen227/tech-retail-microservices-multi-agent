import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchProductService } from './search_product.service';

@Controller('api/v1/ai/product-service/')
export class SearchProductController 
{
  constructor(private readonly searchProductService: SearchProductService) {}

  // GET http://localhost:3003/api/v1/ai/product-service/search?keyword=iphone
  @Get('search')
  async searchProduct(@Query('keyword') keyword: string) {
    return this.searchProductService.searchProduct(keyword);
  }
}