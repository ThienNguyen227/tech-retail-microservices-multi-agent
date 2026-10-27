import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface CustomerAddressSearchParams {
  userId?: string;
  customerCode?: string;
}

@Injectable()
export class GetCustomerAddressesService {
  // Khởi tạo service với Prisma cho truy vấn địa chỉ customer.
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

  // Chuẩn hóa và kiểm tra định danh dùng để tìm địa chỉ customer.
  private normalizeParams(params: CustomerAddressSearchParams) {
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

  // Tìm customer để lấy customer_id nội bộ cho truy vấn địa chỉ.
  private async findCustomer(params: CustomerAddressSearchParams) {
    const normalized = this.normalizeParams(params);

    if (normalized.userId && normalized.customerCode) {
      return this.prisma.customer.findFirst({
        where: {
          customer_user_id: this.parseUserId(normalized.userId),
          customer_code: normalized.customerCode,
        },
        select: {
          customer_id: true,
        },
      });
    }

    if (normalized.userId) {
      return this.prisma.customer.findUnique({
        where: {
          customer_user_id: this.parseUserId(normalized.userId),
        },
        select: {
          customer_id: true,
        },
      });
    }

    return this.prisma.customer.findUnique({
      where: {
        customer_code: normalized.customerCode!,
      },
      select: {
        customer_id: true,
      },
    });
  }

  // Trả danh sách địa chỉ cho tool get_customer_addresses.
  async getCustomerAddresses(params: CustomerAddressSearchParams) {
    const customer = await this.findCustomer(params);

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const addresses = await this.prisma.customer_Address.findMany({
      where: {
        customer_address_customer_id: customer.customer_id,
      },
      orderBy: {
        customer_address_default: 'desc',
      },
    });

    return addresses.map((address) => ({
      customer_address_id: address.customer_address_id.toString(),
      customer_address_customer_id:
        address.customer_address_customer_id.toString(),
      customer_address_line: address.customer_address_line,
      customer_address_ward: address.customer_address_ward,
      customer_address_province: address.customer_address_province,
      customer_address_default: address.customer_address_default,
      customer_address_created_at:
        address.customer_address_created_at,
      customer_address_updated_at:
        address.customer_address_updated_at,
    }));
  }
}
