import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('api/v1/customer-session/product-service')
export class ProductController 
{
  constructor(private readonly productService: ProductService) {}

  // 1.
  // GET http://localhost:3003/api/v1/products?category=slug
  @Get('product-list')
  async getProductListByCategorySlug(@Query('category') categorySlug: string, @Query('brand') brandSlug?: string) {
    return this.productService.getProductListByCategorySlug(categorySlug, brandSlug);
  }

  // 2.
  // GET http://localhost:3003/api/v1/products/brands?category=slug
  @Get('brand-list')
  async getBrandListByCategorySlug(@Query('category') slug: string) {
    return this.productService.getBrandListByCategorySlug(slug);
  }

  // 3.
  // GET http://localhost:3003/api/v1/products/product-detail?name=slug
  @Get('product-detail')
  async getProductDetailBySlug(@Query('name') slug:string){
    return this.productService.getProductDetailBySlug(slug);
  }
  
}