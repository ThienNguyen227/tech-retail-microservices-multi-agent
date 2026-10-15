import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Product,
  ProductDocument,
} from '../../../products/schemas/product.schema';

import {
  Category,
  CategoryDocument,
} from '../../../products/schemas/category.schema';

import {
  Brand,
  BrandDocument,
} from '../../../products/schemas/brand.schema';

@Injectable()
export class CompareTabletService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Các tiêu chí được phép so sánh
  private readonly allowedCriteria = [
    'all',
    'screenTech',
    'screenSize',
    'variants',
    'screen',
    'operatingSystemAndCpu',
    'memoryAndStorage',
    'rearCamera',
    'frontCamera',
    'connectivity',
    'utilities',
    'batteryAndCharge',
    'designAndMaterials',
  ];

  async compareTablets(
    products: string[],
    criteria?: string[],
  ) {
    // 1. Kiểm tra danh sách sản phẩm
    if (!Array.isArray(products) || products.length < 2 || products.length > 5) {
      throw new BadRequestException(
        'Cần cung cấp từ 2 đến 5 máy tính bảng để so sánh',
      );
    }

    const normalizedProducts = products.map((name) => name?.trim());

    if (normalizedProducts.some((name) => !name)) {
      throw new BadRequestException(
        'Tên máy tính bảng không được để trống',
      );
    }

    // Không cho phép tên sản phẩm trùng nhau
    const uniqueProductNames = new Set(
      normalizedProducts.map((name) => name.toLowerCase()),
    );

    if (uniqueProductNames.size !== normalizedProducts.length) {
      throw new BadRequestException(
        'Danh sách máy tính bảng không được có tên trùng lặp',
      );
    }

    // 2. Chuẩn hóa và kiểm tra tiêu chí
    const uniqueCriteria = [...new Set(criteria ?? [])];

    const invalidCriteria = uniqueCriteria.filter(
      (field) => !this.allowedCriteria.includes(field),
    );

    if (invalidCriteria.length > 0) {
      throw new BadRequestException({
        message: 'Có tiêu chí so sánh không hợp lệ',
        invalidCriteria,
        allowedCriteria: this.allowedCriteria,
      });
    }

    // 3. Tìm chính xác từng sản phẩm thuộc danh mục tablet
    const foundProducts = [];

    for (const productName of normalizedProducts) {
      const product = await this.productModel
        .findOne({
          name: {
            $regex: `^${this.escapeRegex(productName)}$`,
            $options: 'i',
          },
          categoryId: '3',
        })
        .lean()
        .exec();

      if (!product) {
        throw new NotFoundException(
          `Không tìm thấy máy tính bảng: ${productName}`,
        );
      }

      foundProducts.push(product);
    }

    // 4. Không truyền tiêu chí hoặc có "all": trả toàn bộ dữ liệu
    if (
      uniqueCriteria.length === 0 ||
      uniqueCriteria.includes('all')
    ) {
      return {
        count: foundProducts.length,
        data: foundProducts,
      };
    }

    // 5. Chỉ trả về các trường được yêu cầu
    const data = foundProducts.map((product) => {
      const productData = product as unknown as Record<string, unknown>;

      const result: Record<string, unknown> = {
        _id: product._id,
        name: product.name,
      };

      for (const field of uniqueCriteria) {
        result[field] = productData[field];
      }

      return result;
    });

    return {
      count: data.length,
      data,
    };
  }
}