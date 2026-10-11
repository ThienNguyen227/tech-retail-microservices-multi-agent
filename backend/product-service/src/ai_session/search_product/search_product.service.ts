import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Product,
  ProductDocument,
} from '../../products/schemas/product.schema';

import {
  Category,
  CategoryDocument,
} from '../../products/schemas/category.schema';

import {
  Brand,
  BrandDocument,
} from '../../products/schemas/brand.schema';

interface SearchProductParams {
  keyword?: string;
  brand?: string;
  category?: string;
  storage?: string;
  color?: string;
  min_price?: string;
  max_price?: string;
  limit?: string;
}

@Injectable()
export class SearchProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  async searchProducts(params: SearchProductParams) {
    const {
      keyword,
      brand,
      category,
      storage,
      color,
      min_price,
      max_price,
      limit,
    } = params;

    // 1. Kiểm tra và chuẩn hóa khoảng giá
    const minPrice = min_price !== undefined ? Number(min_price) : undefined;

    const maxPrice = max_price !== undefined ? Number(max_price) : undefined;

    if (
      (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined &&
        (!Number.isFinite(maxPrice) || maxPrice < 0))
    ) {
      throw new BadRequestException('Khoảng giá không hợp lệ');
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException(
        'Giá tối thiểu không được lớn hơn giá tối đa',
      );
    }

    const resultLimit = limit !== undefined ? Number(limit) : 10;

    if (
      !Number.isInteger(resultLimit) ||
      resultLimit < 1 ||
      resultLimit > 100
    ) {
      throw new BadRequestException(
        'limit phải là số nguyên từ 1 đến 100',
      );
    }

    // 2. Tạo điều kiện tìm kiếm
    const filter: Record<string, any> = {};

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (keyword?.trim()) {
      const regex = new RegExp(
        escapeRegex(keyword.trim()),
        'i',
      );

      filter.$or = [
        { name: regex },
        { slug: regex },
        { 'variants.sku': regex },
      ];
    }

    // 3. Lọc theo thương hiệu
    if (brand?.trim()) {
      const brandRegex = new RegExp(
        `^${escapeRegex(brand.trim())}$`,
        'i',
      );

      const brandDocument = await this.brandModel
        .findOne({ name: brandRegex })
        .lean()
        .exec();

      if (!brandDocument) {
        return { total: 0, products: [] };
      }

      filter.brandId = String(brandDocument._id);
    }

    // 4. Lọc theo danh mục
    if (category?.trim()) {
      const categoryRegex = new RegExp(
        `^${escapeRegex(category.trim())}$`,
        'i',
      );

      const categoryDocument = await this.categoryModel
        .findOne({ name: categoryRegex })
        .lean()
        .exec();

      if (!categoryDocument) {
        return { total: 0, products: [] };
      }

      filter.categoryId = String(categoryDocument._id);
    }

    // 5. Lọc các thuộc tính của cùng một variant
    const variantFilter: Record<string, any> = {};

    if (storage?.trim()) {
      variantFilter.storage = new RegExp(
        `^${escapeRegex(storage.trim())}$`,
        'i',
      );
    }

    if (color?.trim()) {
      variantFilter.color = new RegExp(
        `^${escapeRegex(color.trim())}$`,
        'i',
      );
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      variantFilter.price = {};

      if (minPrice !== undefined) {
        variantFilter.price.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        variantFilter.price.$lte = maxPrice;
      }
    }

    if (Object.keys(variantFilter).length > 0) {
      filter.variants = { $elemMatch: variantFilter };
    }

    // 6. Truy vấn MongoDB
    const products = await this.productModel
      .find(filter)
      .limit(resultLimit)
      .lean()
      .exec();

    // 7. Trả về thông tin cần thiết cho Product Agent
    const result = products.map((product: any) => ({
      name: product.name,
      slug: product.slug,
      brandId: product.brandId,
      categoryId: product.categoryId,
      screenTech: product.screenTech,
      screenSize: product.screenSize,

      variants: (product.variants ?? [])
        .filter((variant: any) => {
          if (
            storage &&
            variant.storage?.toLowerCase() !==
              storage.trim().toLowerCase()
          ) {
            return false;
          }

          if (
            color &&
            variant.color?.toLowerCase() !==
              color.trim().toLowerCase()
          ) {
            return false;
          }

          if (
            minPrice !== undefined &&
            variant.price < minPrice
          ) {
            return false;
          }

          if (
            maxPrice !== undefined &&
            variant.price > maxPrice
          ) {
            return false;
          }

          return true;
        })
        .map((variant: any) => ({
          sku: variant.sku,
          storage: variant.storage,
          color: variant.color,
          price: variant.price,
        })),
    }));

    return {
      total: result.length,
      products: result,
    };
  }
}