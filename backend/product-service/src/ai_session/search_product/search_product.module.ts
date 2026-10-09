import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SearchProductController } from './search_product.controller';
import { SearchProductService } from './search_product.service';

import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { Category, CategorySchema } from '../../products/schemas/category.schema';
import { Brand, BrandSchema } from '../../products/schemas/brand.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
    ]),
  ],
  controllers: [SearchProductController],
  providers: [SearchProductService],
  exports: [SearchProductService],
})
export class SearchProductModule {}