import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompareProductController } from './compare_product.controller';
import { CompareProductService } from './compare_product.service';

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
  controllers: [CompareProductController],
  providers: [CompareProductService],
  exports: [CompareProductService],
})
export class CompareProductlModule {}