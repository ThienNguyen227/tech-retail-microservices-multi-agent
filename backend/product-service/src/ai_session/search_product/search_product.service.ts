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
    const { keyword, brand, category, storage, color, min_price, max_price, limit} = params;

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const createRegex = (value: string) =>
      new RegExp(escapeRegex(value.trim()), 'i');

    // 1. Kiểm tra khoảng giá
    const minPrice =
      min_price !== undefined ? Number(min_price) : undefined;

    const maxPrice =
      max_price !== undefined ? Number(max_price) : undefined;

    if (
      (minPrice !== undefined &&
        (!Number.isFinite(minPrice) || minPrice < 0)) ||
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

    // 2. Kiểm tra số lượng kết quả
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

    // 3. Tìm kiếm từ khóa gần đúng
    const filter: Record<string, any> = {};

    if (keyword?.trim()) {
      const regex = createRegex(keyword);

      filter.$or = [
        { name: regex },
        { slug: regex },
        { 'variants.sku': regex },
      ];
    }

    // 4. Tìm thương hiệu gần đúng
    if (brand?.trim()) {
      const brandDocument = await this.brandModel
        .findOne({ name: createRegex(brand) })
        .lean()
        .exec();

      if (!brandDocument) {
        return { total: 0, products: [] };
      }

      filter.brandId = String(
        (brandDocument as any).id ?? brandDocument._id,
      );
    }

    // 5. Tìm danh mục gần đúng
    if (category?.trim()) {
      const categoryDocument = await this.categoryModel
        .findOne({ name: createRegex(category) })
        .lean()
        .exec();

      if (!categoryDocument) {
        return { total: 0, products: [] };
      }

      // Dùng id nếu sản phẩm lưu categoryId dạng "1".
      filter.categoryId = String(
        (categoryDocument as any).id ??
        categoryDocument._id,
      );
    }

    // 6. Lọc các thuộc tính của cùng một phiên bản sản phẩm
    const variantFilter: Record<string, any> = {};

    if (storage?.trim()) {
      variantFilter.storage = createRegex(storage);
    }

    if (color?.trim()) {
      variantFilter.color = createRegex(color);
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

    // 7. Truy vấn sản phẩm
    const products = await this.productModel
      .find(filter)
      .limit(resultLimit)
      .lean()
      .exec();

    // 8. Lọc và trả về các phiên bản phù hợp
    const result = products
      .map((product: any) => {
        const variants = (product.variants ?? [])
          .filter((variant: any) => {
            if (
              storage?.trim() &&
              !createRegex(storage).test(variant.storage ?? '')
            ) {
              return false;
            }

            if (
              color?.trim() &&
              !createRegex(color).test(variant.color ?? '')
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
          }));

        return {
          name: product.name,
          slug: product.slug,
          brandId: product.brandId,
          categoryId: product.categoryId,
          screenTech: product.screenTech,
          screenSize: product.screenSize,
          variants,
        };
      });

    return {
      total: result.length,
      products: result,
    };
  }
}