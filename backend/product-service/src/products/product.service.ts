import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

}