import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ComparePhoneController } from './compare_phone.controller';
import { ComparePhoneService } from './compare_phone.service';

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
  controllers: [ComparePhoneController],
  providers: [ComparePhoneService],
  exports: [ComparePhoneService],
})
export class ComparePhoneModule {}