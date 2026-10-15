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
export class ComparePhoneService {
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

  // Các tiêu chí được phép truy xuất
  private readonly allowedCriteria = [
    'all',
    'screenTech',
    'screenSize',
    'variants',
    'specifications',
    'performanceAndStorage',
    'cameraAndScreen',
    'batteryAndCharge',
    'utilities',
    'connectivity',
    'designAndMaterials',
  ];

  async comparePhones(
    products: string[],
    criteria?: string[],
  ) {
    // 1. Kiểm tra danh sách sản phẩm
    if (!Array.isArray(products) || products.length < 2 || products.length > 5) {
      throw new BadRequestException(
        'Số lượng điện thoại cần so sánh phải từ 2 đến 5',
      );
    }

    // 2. Kiểm tra tên sản phẩm
    const normalizedProducts = products.map((name) => name?.trim());

    if (normalizedProducts.some((name) => !name)) {
      throw new BadRequestException(
        'Tên điện thoại không được để trống',
      );
    }

    // Không cho phép tên sản phẩm trùng nhau (không phân biệt hoa thường)
    const uniqueNames = new Set(
      normalizedProducts.map((name) => name.toLowerCase()),
    );

    if (uniqueNames.size !== normalizedProducts.length) {
      throw new BadRequestException(
        'Danh sách không được chứa điện thoại trùng tên',
      );
    }

    // 3. Chuẩn hóa và kiểm tra criteria
    // const uniqueCriteria = [...new Set(criteria ?? [])];
    const normalizedCriteria = Array.isArray(criteria)
      ? criteria
      : criteria
        ? [criteria]
        : [];

    const uniqueCriteria = [...new Set(normalizedCriteria)];

    const invalidCriteria = uniqueCriteria.filter(
      (field) => !this.allowedCriteria.includes(field),
    );

    if (invalidCriteria.length > 0) {
      throw new BadRequestException({
        message: 'Có tiêu chí không hợp lệ',
        invalidCriteria,
        allowedCriteria: this.allowedCriteria,
      });
    }

    // 4. Lấy dữ liệu từng sản phẩm và kiểm tra loại sản phẩm
    const foundProducts = await Promise.all(
      normalizedProducts.map((name) =>
        this.productModel
          .findOne({
            name: {
              $regex: `^${this.escapeRegex(name)}$`,
              $options: 'i',
            },
          })
          .lean()
          .exec(),
      ),
    );

    // 5. Kiểm tra sản phẩm có tồn tại không
    const missingProducts = normalizedProducts.filter(
      (_, index) => !foundProducts[index],
    );

    if (missingProducts.length > 0) {
      throw new NotFoundException({
        message: 'Không tìm thấy sản phẩm',
        missingProducts,
      });
    }

    // 6. Kiểm tra tất cả sản phẩm có phải điện thoại không
    const nonPhones = foundProducts
      .filter((product) => product && product.categoryId !== '1')
      .map((product) => product!.name);

    if (nonPhones.length > 0) {
      throw new BadRequestException({
        message: 'Chỉ được so sánh các sản phẩm cùng loại là điện thoại',
        invalidProducts: nonPhones,
      });
    }

    // 7. Không truyền criteria hoặc có "all" thì trả toàn bộ dữ liệu
    if (
      uniqueCriteria.length === 0 ||
      uniqueCriteria.includes('all')
    ) {
      return {
        count: foundProducts.length,
        data: foundProducts,
      };
    }

    // 8. Chỉ trả về các trường được yêu cầu
    const data = foundProducts.map((product) => {
      const productData = product as unknown as Record<string, unknown>;

      const result: Record<string, unknown> = {
        _id: product!._id,
        name: product!.name,
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