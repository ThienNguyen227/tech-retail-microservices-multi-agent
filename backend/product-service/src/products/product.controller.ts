import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('api/v1/products')
export class ProductController 
{
  constructor(private readonly productService: ProductService) {}

  // 1.
  // GET http://localhost:3003/api/v1/products?category=slug
  // @Get()
  // async getProductListByCategorySlug(@Query('category') slug: string) {
  //   return this.productService.getProductListByCategorySlug(slug);
  // }
  @Get()
  async getProductList(@Query('category') categorySlug: string, @Query('brand') brandSlug?: string) {
    return this.productService.getProductListByCategorySlug(categorySlug, brandSlug);
  }

  // 2.
  // GET http://localhost:3003/api/v1/products/brands?category=slug
  @Get('brands')
  async getBrandListByCategorySlug(@Query('category') slug: string) {
    return this.productService.getBrandListByCategorySlug(slug);
  }

  // GET /products/brand/:slug
  // Ví dụ: GET http://localhost:3003/products/brand/dtdd-iphone
  // @Get('brand/:slug')
  // async getProductListInBrandByBrandSlug(@Param('slug') slug: string) {
  //   return this.productService.getProductListInBrandByBrandSlug(slug);
  // }

  // GET /products/:slug
  // Ví dụ: GET http://localhost:3003/products/iphone-17-pro
  // @Get(':slug')
  // async getBySlug(@Param('slug') slug: string) {
  //   return this.productService.getProductBySlug(slug);
  // }
}