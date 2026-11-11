import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Brand, BrandDocument } from './schemas/brand.schema';

@Injectable()
export class ProductService {
  constructor
  (
    @InjectModel(Product.name) 
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
  ) {}

  // 1. GET -> product list by category slug 
  async getProductListByCategorySlug(categorySlug: string, brandSlug?: string): Promise<{ category: Category; products: Product[] }> {
    const category = await this.categoryModel.findOne({ slug: categorySlug }).lean().exec();

    if (!category) {
      throw new NotFoundException(
        `Không tìm thấy danh mục có slug '${categorySlug}'`,
      );
    }

    const filter: any = {categoryId: category.id};

    // Nếu có brand thì lọc thêm brand
    if (brandSlug) {
      const brand = await this.brandModel.findOne({slug: brandSlug, categoryId: category.id}).lean().exec();

      if (!brand) {
        throw new NotFoundException(
          `Không tìm thấy thương hiệu có slug '${brandSlug}'`,
        );
      }

      filter.brandId = brand.id;
    }

    const products = await this.productModel.find(filter).lean().exec();

    return {
      category,
      products,
    };
  }

  // 2. GET -> brand list by category slug
  async getBrandListByCategorySlug(slug: string): Promise<{brands: Brand[];}>
  {
    const category = await this.categoryModel.findOne({ slug }).lean().exec();

    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục có slug '${slug}'`);
    }
    const brands = await this.brandModel.find({ categoryId: category.id }).lean().exec(); 

    return {
      brands,
    };
  }

  // 3. GET -> product detail 
  async getProductDetailBySlug(slug: string): Promise<{product: Product, category: Category;}> {
    const product = await this.productModel.findOne({'variants.slug': slug}).lean().exec();

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với slug '${slug}'`);
    }

    const category = await this.categoryModel.findOne({ id: product.categoryId }).lean().exec();

    if (!category) {
      throw new NotFoundException(
        `Không tìm thấy danh mục của sản phẩm`,
      );
    }

    return { 
      product,
      category,
    }
  }

  // 4. POST -> compare phones
  async comparePhones(ids: string[]) {
    // ----------------------------------------------------------
    // 1. VALIDATE INPUT
    // ----------------------------------------------------------

    if (!Array.isArray(ids)) {
      throw new BadRequestException(
        'Danh sách ID sản phẩm không hợp lệ',
      );
    }

    if (ids.length < 2 || ids.length > 3) {
      throw new BadRequestException(
        'Chỉ được so sánh từ 2 đến 3 điện thoại',
      );
    }

    // ----------------------------------------------------------
    // 2. VALIDATE MONGODB OBJECT ID
    // ----------------------------------------------------------

    const normalizedIds = ids.map((id) => {
      if (
        typeof id !== 'string' ||
        !Types.ObjectId.isValid(id.trim())
      ) {
        throw new BadRequestException(
          `Product ID '${id}' không hợp lệ`,
        );
      }

      return id.trim().toLowerCase();
    });

    // ----------------------------------------------------------
    // 3. CHECK DUPLICATE IDS
    // ----------------------------------------------------------

    if (
      new Set(normalizedIds).size !== normalizedIds.length
    ) {
      throw new BadRequestException(
        'Không thể so sánh cùng một sản phẩm nhiều lần',
      );
    }

    // ----------------------------------------------------------
    // 4. FIND PHONE CATEGORY
    // ----------------------------------------------------------

    const phoneCategory = await this.categoryModel
      .findOne({
        slug: 'dien-thoai-di-dong',
      })
      .lean()
      .exec();

    if (!phoneCategory) {
      throw new NotFoundException(
        'Không tìm thấy danh mục điện thoại di động',
      );
    }

    // ----------------------------------------------------------
    // 5. FIND PRODUCTS FROM MONGODB
    // ----------------------------------------------------------

    const objectIds = normalizedIds.map(
      (id) => new Types.ObjectId(id),
    );

    const products = await this.productModel
      .find({
        _id: {
          $in: objectIds,
        },
      })
      .lean()
      .exec();

    // ----------------------------------------------------------
    // 6. CHECK PRODUCTS EXIST
    // ----------------------------------------------------------

    if (products.length !== normalizedIds.length) {
      throw new NotFoundException(
        'Một hoặc nhiều sản phẩm không tồn tại',
      );
    }

    // ----------------------------------------------------------
    // 7. CHECK PHONE CATEGORY
    // ----------------------------------------------------------

    const phoneCategoryId = String(phoneCategory.id);

    for (const product of products) {
      if (String(product.categoryId) !== phoneCategoryId) {
        throw new BadRequestException(
          `Sản phẩm '${product.name}' không thuộc danh mục điện thoại`,
        );
      }
    }

    // ----------------------------------------------------------
    // 8. SORT PRODUCTS BY REQUESTED IDS
    // ----------------------------------------------------------

    const productMap = new Map(
      products.map(
        (product) => [
          String(product._id).toLowerCase(),
          product,
        ] as const,
      ),
    );

    const orderedProducts = normalizedIds.map((id) => {
      const product = productMap.get(id);

      if (!product) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm có ID '${id}'`,
        );
      }

      return product;
    });

    // ----------------------------------------------------------
    // 9. RETURN ALL PRODUCT DATA
    // ----------------------------------------------------------

    return {
      message: 'So sánh điện thoại thành công',
      count: orderedProducts.length,
      products: orderedProducts,
    };
  }

}