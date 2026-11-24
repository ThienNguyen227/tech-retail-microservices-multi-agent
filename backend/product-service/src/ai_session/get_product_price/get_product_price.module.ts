import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GetProductPriceController } from './get_product_price.controller';
import { GetProductPriceService } from './get_product_price.service';

import {
  Product,
  ProductSchema,
} from '../../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [GetProductPriceController],
  providers: [GetProductPriceService],
  exports: [GetProductPriceService],
})
export class GetProductPriceModule {}