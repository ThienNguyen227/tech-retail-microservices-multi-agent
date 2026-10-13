
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
export class CompareProductService {
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

  // async comparePhones(product1: string, product2: string) {
  //   // 1. Validate input
  //   if (!product1?.trim() || !product2?.trim()) {
  //     throw new BadRequestException(
  //       'Vui lòng cung cấp tên của cả hai sản phẩm.',
  //     );
  //   }

  //   if (
  //     product1.trim().toLowerCase() ===
  //     product2.trim().toLowerCase()
  //   ) {
  //     throw new BadRequestException(
  //       'Vui lòng chọn hai sản phẩm khác nhau.',
  //     );
  //   }

  //   // 2. Find both products by name
  //   const [phone1, phone2] = await Promise.all([
  //     this.productModel
  //       .findOne({
  //         name: {
  //           $regex: `^${this.escapeRegex(product1.trim())}$`,
  //           $options: 'i',
  //         },
  //       })
  //       .lean(),

  //     this.productModel
  //       .findOne({
  //         name: {
  //           $regex: `^${this.escapeRegex(product2.trim())}$`,
  //           $options: 'i',
  //         },
  //       })
  //       .lean(),
  //   ]);

  //   // 3. Check products exist
  //   if (!phone1) {
  //     throw new NotFoundException(
  //       `Không tìm thấy sản phẩm: ${product1}`,
  //     );
  //   }

  //   if (!phone2) {
  //     throw new NotFoundException(
  //       `Không tìm thấy sản phẩm: ${product2}`,
  //     );
  //   }

  //   // 4. Check both products belong to the same category
  //   if (
  //     String(phone1.categoryId) !== String(phone2.categoryId)
  //   ) {
  //     throw new BadRequestException(
  //       'Hai sản phẩm không thuộc cùng danh mục.',
  //     );
  //   }

  //   // 5. Return product data for comparison
  //   return {
  //     message: 'Lấy dữ liệu so sánh sản phẩm thành công.',
  //     products: [phone1, phone2],
  //   };
  // }
  
// async comparePhones(products: string[]) {
//   if (!Array.isArray(products)) {
//     products = [products];
//   }

//   const productNames = products.map((name) => name.trim());

//   if (
//     productNames.length < 2 ||
//     productNames.length > 5 ||
//     productNames.some((name) => !name)
//   ) {
//     throw new BadRequestException(
//       'Vui lòng cung cấp từ 2 đến 5 tên sản phẩm hợp lệ.',
//     );
//   }

//   if (
//     new Set(productNames.map((name) => name.toLowerCase())).size !==
//     productNames.length
//   ) {
//     throw new BadRequestException(
//       'Không được chọn sản phẩm trùng nhau.',
//     );
//   }

//   const foundProducts = await Promise.all(
//     productNames.map((name) =>
//       this.productModel
//         .findOne({
//           name: {
//             $regex: `^${this.escapeRegex(name)}$`,
//             $options: 'i',
//           },
//         })
//         .lean()
//         .exec(),
//     ),
//   );

//   const missingProducts = productNames.filter(
//     (_, index) => !foundProducts[index],
//   );

//   if (missingProducts.length > 0) {
//     throw new NotFoundException({
//       message: 'Không tìm thấy sản phẩm.',
//       products: missingProducts,
//     });
//   }

//   const categoryIds = new Set(
//     foundProducts.map((product) => String(product!.categoryId)),
//   );

//   if (categoryIds.size !== 1) {
//     throw new BadRequestException(
//       'Các sản phẩm phải thuộc cùng một danh mục.',
//     );
//   }

//   return {
//     total: foundProducts.length,
//     products: foundProducts,
//   };
// }

async comparePhones(
  products: string[],
  criteria?: string[],
) {
  if (!Array.isArray(products)) {
    products = [products];
  }

  const productNames = products.map((name) => name.trim());

  if (
    productNames.length < 2 ||
    productNames.length > 5 ||
    productNames.some((name) => !name)
  ) {
    throw new BadRequestException(
      'Vui lòng cung cấp từ 2 đến 5 tên sản phẩm hợp lệ.',
    );
  }

  if (
    new Set(productNames.map((name) => name.toLowerCase())).size !==
    productNames.length
  ) {
    throw new BadRequestException(
      'Không được chọn sản phẩm trùng nhau.',
    );
  }

  // Ánh xạ tiêu chí với các trường cần truy xuất
  const criteriaFields: Record<string, string[]> = {
    basic: ['name', 'brandId', 'categoryId'],
    variant: ['name', 'variants.storage', 'variants.color', 'variants.price'],
    price: ['name', 'variants.storage', 'variants.price'],
    performance: [
      'name',
      'performanceAndStorage',
      'specifications.chip',
    ],
    camera: [
      'name',
      'cameraAndScreen.rearCameraResolution',
      'cameraAndScreen.frontCameraResolution',
      'cameraAndScreen.rearCameraFeatures',
      'cameraAndScreen.frontCameraFeatures',
      'cameraAndScreen.rearVideoRecording',
    ],
    screen: [
      'name',
      'cameraAndScreen.screenTechnology',
      'cameraAndScreen.screenResolution',
      'cameraAndScreen.screenSize',
      'cameraAndScreen.refreshRate',
      'cameraAndScreen.maxBrightness',
      'cameraAndScreen.touchScreenGlass',
    ],
    battery: ['name', 'batteryAndCharge'],
    connectivity: ['name', 'connectivity'],
    design: ['name', 'designAndMaterials'],
    utilities: ['name', 'utilities'],
    all: [],
  };

  // Kiểm tra tiêu chí hợp lệ
  const selectedCriteria = criteria?.length ? criteria : ['all'];

  const invalidCriteria = selectedCriteria.filter(
    (item) => !criteriaFields[item],
  );

  if (invalidCriteria.length > 0) {
    throw new BadRequestException({
      message: 'Tiêu chí so sánh không hợp lệ.',
      invalidCriteria,
      supportedCriteria: Object.keys(criteriaFields),
    });
  }

  // Xây dựng danh sách trường cần lấy
  const fields = new Set<string>(['_id', 'name', 'categoryId']);

  for (const criterion of selectedCriteria) {
    for (const field of criteriaFields[criterion]) {
      fields.add(field);
    }
  }

  const selectFields =
    selectedCriteria.includes('all')
      ? ''
      : Array.from(fields).join(' ');

  const foundProducts = await Promise.all(
    productNames.map((name) => {
      let query = this.productModel.findOne({
        name: {
          $regex: `^${this.escapeRegex(name)}$`,
          $options: 'i',
        },
      });

      if (selectFields) {
        query = query.select(selectFields);
      }

      return query.lean().exec();
    }),
  );

  const missingProducts = productNames.filter(
    (_, index) => !foundProducts[index],
  );

  if (missingProducts.length > 0) {
    throw new NotFoundException({
      message: 'Không tìm thấy sản phẩm.',
      products: missingProducts,
    });
  }

  const categoryIds = new Set(
    foundProducts.map((product) => String(product!.categoryId)),
  );

  if (categoryIds.size !== 1) {
    throw new BadRequestException(
      'Các sản phẩm phải thuộc cùng một danh mục.',
    );
  }

  return {
    total: foundProducts.length,
    criteria: selectedCriteria,
    products: foundProducts,
  };
}
 
}
