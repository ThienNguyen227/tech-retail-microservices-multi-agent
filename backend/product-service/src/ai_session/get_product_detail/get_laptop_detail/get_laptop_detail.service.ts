
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
export class GetLaptopDetailService {
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

    async getLaptopDetail(
        laptopName: string,
        criteria?: string[],
    ) {
        if (!laptopName?.trim()) {
            throw new BadRequestException(
                'Tên laptop không được để trống',
            );
        }

        const product = await this.productModel
            .findOne({
                name: {
                    $regex: `^${this.escapeRegex(laptopName.trim())}$`,
                    $options: 'i',
                },
                categoryId: '2',
            })
            .lean()
            .exec();

        if (!product) {
            throw new NotFoundException(
                `Không tìm thấy laptop: ${laptopName}`,
            );
        }

        // Chuẩn hóa criteria và loại bỏ tiêu chí trùng lặp
        const uniqueCriteria = [...new Set(criteria ?? [])];

        // Kiểm tra tiêu chí hợp lệ
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

        // Không truyền tiêu chí hoặc có "all" thì trả toàn bộ
        if (
            uniqueCriteria.length === 0 ||
            uniqueCriteria.includes('all')
        ) {
            return product;
        }

        // Chỉ trả về các trường được yêu cầu
        const productData = product as unknown as Record<
            string,
            unknown
        >;

        const result: Record<string, unknown> = {
            _id: product._id,
        };

        for (const field of uniqueCriteria) {
            result[field] = productData[field];
        }

        return result;
    }
}
