import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompareTabletController } from './compare_tablet.controller';
import { CompareTabletService } from './compare_tablet.service';

import { Product, ProductSchema } from '../../../products/schemas/product.schema';
import { Category, CategorySchema } from '../../../products/schemas/category.schema';
import { Brand, BrandSchema } from '../../../products/schemas/brand.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
    ]),
  ],
  controllers: [CompareTabletController],
  providers: [CompareTabletService],
  exports: [CompareTabletService],
})
export class CompareTabletModule {}