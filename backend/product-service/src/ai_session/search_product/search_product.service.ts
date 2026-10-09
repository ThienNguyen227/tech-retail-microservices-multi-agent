import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { Category, CategoryDocument } from '../../products/schemas/category.schema';
import { Brand, BrandDocument } from '../../products/schemas/brand.schema';

@Injectable()
export class SearchProductService {
  constructor
  (
    @InjectModel(Product.name) 
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  async searchProduct(keyword: string): Promise<Product[]> {
    if (!keyword || !keyword.trim()) {
      throw new BadRequestException('Từ khóa tìm kiếm không được để trống');
    }

    const products = await this.productModel
      .find({
        $or: [
          {
            name: {
              $regex: keyword.trim(),
              $options: 'i',
            },
          },
          {
            'variants.name': {
              $regex: keyword.trim(),
              $options: 'i',
            },
          },
        ],
      })
      .lean()
      .exec();

    return products;
  }

  

}