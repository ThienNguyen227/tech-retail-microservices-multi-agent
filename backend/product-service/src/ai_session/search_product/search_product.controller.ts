import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { SearchProductService } from './search_product.service';

@Controller('api/v1/ai/product-service')
export class SearchProductController {
  constructor(
    private readonly searchProductService: SearchProductService,
  ) {}

  @Get('search')
  searchProducts(
    @Query('keyword') keyword?: string,
    @Query('brand') brand?: string,
    @Query('category') category?: string,
    @Query('storage') storage?: string,
    @Query('color') color?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchProductService.searchProducts({
      keyword,
      brand,
      category,
      storage,
      color,
      min_price: minPrice,
      max_price: maxPrice,
      limit,
    });
  }
}