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
export class CompareLaptopService {
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

  // Các tiêu chí được phép truy xuất theo document Laptop
  private readonly allowedCriteria = [
    'all',
    'variants',
    'processor',
    'graphics',
    'memoryAndStorage',
    'display',
    'connectivityAndExpansion',
    'dimensionsAndBattery',
  ];

  async compareLaptops(
    products: string[],
    criteria?: string[],
  ) {
    // 1. Kiểm tra số lượng sản phẩm
    if (
      !Array.isArray(products) ||
      products.length < 2 ||
      products.length > 5
    ) {
      throw new BadRequestException(
        'Số lượng laptop cần so sánh phải từ 2 đến 5',
      );
    }

    // 2. Chuẩn hóa tên sản phẩm
    const normalizedProducts = products.map((name) =>
      typeof name === 'string' ? name.trim() : '',
    );

    if (normalizedProducts.some((name) => !name)) {
      throw new BadRequestException(
        'Tên laptop không được để trống',
      );
    }

    // 3. Không cho phép tên trùng nhau
    const uniqueNames = new Set(
      normalizedProducts.map((name) => name.toLowerCase()),
    );

    if (uniqueNames.size !== normalizedProducts.length) {
      throw new BadRequestException(
        'Danh sách không được chứa laptop trùng tên',
      );
    }

    // 4. Chuẩn hóa và kiểm tra tiêu chí
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

    // 5. Truy vấn các sản phẩm theo tên chính xác
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

    // 6. Kiểm tra sản phẩm không tồn tại
    const missingProducts = normalizedProducts.filter(
      (_, index) => !foundProducts[index],
    );

    if (missingProducts.length > 0) {
      throw new NotFoundException({
        message: 'Không tìm thấy sản phẩm',
        missingProducts,
      });
    }

    // 7. Kiểm tra tất cả sản phẩm đều là laptop
    const nonLaptops = foundProducts
      .filter(
        (product) => String(product!.categoryId) !== '2',
      )
      .map((product) => product!.name);

    if (nonLaptops.length > 0) {
      throw new BadRequestException({
        message: 'Chỉ được so sánh các sản phẩm cùng loại là laptop',
        invalidProducts: nonLaptops,
      });
    }

    // 8. Không truyền tiêu chí hoặc có "all": trả toàn bộ dữ liệu
    if (
      uniqueCriteria.length === 0 ||
      uniqueCriteria.includes('all')
    ) {
      return {
        count: foundProducts.length,
        data: foundProducts,
      };
    }

    // 9. Chỉ trả về các trường được yêu cầu
    const data = foundProducts.map((product) => {
      const productData = product as unknown as Record<
        string,
        unknown
      >;

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