import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface SearchCustomerParams {
  userId?: string;
  customerCode?: string;
}

@Injectable()
export class SearchCustomerService {
  // Khởi tạo service với Prisma dùng cho các truy vấn AI session.
  constructor(private readonly prisma: PrismaService) {}

  // Chuyển userId từ query string sang BigInt để truy vấn Prisma.
  private parseUserId(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        'userId phải là số nguyên dương dạng chuỗi',
      );
    }

    return BigInt(value);
  }

  // Chuẩn hóa và kiểm tra định danh customer từ request của AI.
  private normalizeParams(params: SearchCustomerParams) {
    const userId = params.userId?.trim();
    const customerCode = params.customerCode?.trim();

    if (!userId && !customerCode) {
      throw new BadRequestException(
        'Cần cung cấp userId hoặc customerCode',
      );
    }

    return {
      userId: userId || undefined,
      customerCode: customerCode || undefined,
    };
  }

  // Chuyển dữ liệu customer về response JSON an toàn với BigInt.
  private formatCustomerResponse(customer: any) {
    return {
      customer_id: customer.customer_id.toString(),
      customer_user_id: customer.customer_user_id.toString(),
      customer_code: customer.customer_code,
      customer_full_name: customer.customer_full_name,
      customer_date_of_birth: customer.customer_date_of_birth,
      customer_gender: customer.customer_gender,
      customer_status: customer.customer_status,
      customer_created_at: customer.customer_created_at,
      customer_updated_at: customer.customer_updated_at,
      addresses: [],
    };
  }

  // Tìm customer theo userId, customerCode hoặc cả hai định danh.
  private async findCustomer(params: SearchCustomerParams) {
    const normalized = this.normalizeParams(params);

    if (normalized.userId && normalized.customerCode) {
      return this.prisma.customer.findFirst({
        where: {
          customer_user_id: this.parseUserId(normalized.userId),
          customer_code: normalized.customerCode,
        },
      });
    }

    if (normalized.userId) {
      return this.prisma.customer.findUnique({
        where: {
          customer_user_id: this.parseUserId(normalized.userId),
        },
      });
    }

    return this.prisma.customer.findUnique({
      where: {
        customer_code: normalized.customerCode!,
      },
    });
  }

  // Trả thông tin hồ sơ customer cho tool search_customer.
  async searchCustomer(params: SearchCustomerParams) {
    const customer = await this.findCustomer(params);

    if (!customer) {
      throw new NotFoundException(
        'Không tìm thấy thông tin khách hàng',
      );
    }

    return this.formatCustomerResponse(customer);
  }
}
