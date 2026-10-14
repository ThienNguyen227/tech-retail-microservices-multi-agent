import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GetTabletDetailController } from './get_tablet_detail.controller';
import { GetTabletDetailService } from './get_tablet_detail.service';

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
  controllers: [GetTabletDetailController],
  providers: [GetTabletDetailService],
  exports: [GetTabletDetailService],
})
export class GetTabletDetailModule {}