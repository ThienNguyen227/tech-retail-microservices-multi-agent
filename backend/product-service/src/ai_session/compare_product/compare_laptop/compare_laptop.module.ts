import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompareLaptopController } from './compare_laptop.controller';
import { CompareLaptopService } from './compare_laptop.service';

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
  controllers: [CompareLaptopController],
  providers: [CompareLaptopService],
  exports: [CompareLaptopService],
})
export class CompareLaptopModule {}