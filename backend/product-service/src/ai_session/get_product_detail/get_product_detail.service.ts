
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
} from '../../products/schemas/product.schema';
import {
  Category,
  CategoryDocument,
} from '../../products/schemas/category.schema';
import {
  Brand,
  BrandDocument,
} from '../../products/schemas/brand.schema';

@Injectable()
export class GetProductDetailService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  // Tìm theo tên sản phẩm, ví dụ: iPhone 17 Pro Max
  async getProductDetailsByKeyword(keyword: string) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Tên sản phẩm không được để trống');
    }

    const escapedKeyword = keyword.trim().replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );

    const product = await this.productModel
    .findOne({
      name: { $regex: `^${escapedKeyword}$`, $options: 'i' },
    })
    .lean()
    .exec();

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm phù hợp');
    }

    return this.buildProductDetails(product);
  }

  // Bổ sung tên thương hiệu và danh mục vào thông tin sản phẩm
  private async buildProductDetails(product: any) {
    const [brand, category] = await Promise.all([
      this.brandModel.findOne({ id: product.brandId }).lean().exec(),
      this.categoryModel.findOne({ id: product.categoryId }).lean().exec(),
    ]);

    return {
      name: product.name,

      brand: brand?.name ?? null,
      category: category?.name ?? null,

      screenTech: product.screenTech,
      screenSize: product.screenSize,

      variants: (product.variants ?? []).map((variant: any) => ({
        sku: variant.sku,
        storage: variant.storage,
        color: variant.color,
        price: variant.price,
      })),

      specifications: product.specifications,
      performanceAndStorage: product.performanceAndStorage,
      cameraAndScreen: product.cameraAndScreen,
      batteryAndCharge: product.batteryAndCharge,
      utilities: product.utilities,
      connectivity: product.connectivity,
      designAndMaterials: product.designAndMaterials,
    };
  }
}
