import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Product,
  ProductDocument,
} from '../../products/schemas/product.schema';

// Cấu trúc variant trong MongoDB
interface ProductVariant {
  sku?: string;
  price?: number | string;
  storage?: string;
  color?: string;
}

// Document sản phẩm trả về từ MongoDB
interface ProductPriceDocument {
  name?: string;
  image?: string;
  variants?: ProductVariant[];
}

@Injectable()
export class GetProductPriceService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getProductPrices(skus: string[]) {
    // ==========================================
    // 1. VALIDATE DANH SÁCH SKU
    // ==========================================
    if (!Array.isArray(skus) || skus.length === 0) {
      throw new BadRequestException(
        'Danh sách SKU không được để trống',
      );
    }

    if (skus.length > 100) {
      throw new BadRequestException(
        'Số lượng SKU tối đa mỗi lần truy vấn là 100',
      );
    }

    if (
      skus.some(
        (sku) => typeof sku !== 'string' || !sku.trim(),
      )
    ) {
      throw new BadRequestException(
        'Danh sách SKU chứa giá trị không hợp lệ',
      );
    }

    // Loại bỏ SKU trùng lặp
    const normalizedSkus = [
      ...new Set(skus.map((sku) => sku.trim())),
    ];

    const requestedSkuSet = new Set(normalizedSkus);

    // ==========================================
    // 2. TRUY VẤN MONGODB
    // ==========================================
    let productDocuments: ProductPriceDocument[];

    try {
      productDocuments = (await this.productModel.collection
        .find(
          {
            'variants.sku': {
              $in: normalizedSkus,
            },
          },
          {
            projection: {
              _id: 0,
              name: 1,
              image: 1,
              variants: 1,
            },
          },
        )
        .toArray()) as unknown as ProductPriceDocument[];
    } catch (error) {
      console.error(
        '[GET PRODUCT PRICES] MongoDB Error:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể truy vấn giá sản phẩm',
      );
    }

    // ==========================================
    // 3. LẤY SKU VÀ PRICE TƯƠNG ỨNG
    // ==========================================
    const priceMap = new Map<
      string,
      {
        sku: string;
        price: number;
      }
    >();

    for (const product of productDocuments) {
      for (const variant of product.variants ?? []) {
        const sku = variant.sku?.trim();

        // Chỉ lấy những SKU được yêu cầu
        if (!sku || !requestedSkuSet.has(sku)) {
          continue;
        }

        const price = Number(variant.price);

        if (!Number.isFinite(price) || price < 0) {
          throw new InternalServerErrorException(
            `Giá sản phẩm SKU=${sku} không hợp lệ`,
          );
        }

        priceMap.set(sku, {
          sku,
          price,
        });
      }
    }

    // ==========================================
    // 4. TỔNG HỢP KẾT QUẢ THEO DANH SÁCH SKU
    // ==========================================
    const products = normalizedSkus
      .map((sku) => priceMap.get(sku))
      .filter(
        (
          product,
        ): product is NonNullable<typeof product> =>
          product !== undefined,
      );

    const notFoundSkus = normalizedSkus.filter(
      (sku) => !priceMap.has(sku),
    );

    // ==========================================
    // 5. RETURN RESULT
    // ==========================================
    return {
      requestedCount: normalizedSkus.length,

      foundCount: products.length,

      notFoundSkus,

      products,
    };
  }
}