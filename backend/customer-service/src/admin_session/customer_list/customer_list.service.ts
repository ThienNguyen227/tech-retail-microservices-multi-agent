
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';

import { PrismaService } from '../../prisma/prisma.service';
import { GetCustomerListDto } from '../dto/get_customer_list/get_customer_list.dto';

@Injectable()
export class CustomerListService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerList(
    filters: GetCustomerListDto,
    accessToken: string,
  ) {
    // 1. Kiểm tra quyền thông qua user-service
    const userServiceUrl = 'http://localhost:3001';

    let allowed: boolean;

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'customer-list:read',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        },
      );

      allowed = response.data.allowed;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new UnauthorizedException(
            'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
          );
        }

        if (error.response?.status === 403) {
          throw new ForbiddenException(
            'Bạn không có quyền kiểm tra quyền truy cập.',
          );
        }
      }

      throw new ServiceUnavailableException(
        'Không thể xác minh quyền truy cập từ user-service.',
      );
    }

    if (allowed !== true) {
      throw new ForbiddenException(
        'Bạn không có quyền xem danh sách khách hàng.',
      );
    }

    // 2. Tạo điều kiện tìm kiếm
    const search = filters.search?.trim();

    const where = {
      ...(filters.status ? { customer_status: filters.status } : {}),
      ...(search
        ? {
            OR: [
              {
                customer_code: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                customer_full_name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    // 3. Lấy danh sách khách hàng kèm địa chỉ
    try {
      const customers = await this.prisma.customer.findMany({
        where,
        select: {
          customer_id: true,
          customer_user_id: true,
          customer_code: true,
          customer_full_name: true,
          customer_date_of_birth: true,
          customer_gender: true,
          customer_status: true,
          customer_created_at: true,
          customer_updated_at: true,

          addresses: {
            select: {
              customer_address_id: true,
              customer_address_customer_id: true,
              customer_address_line: true,
              customer_address_ward: true,
              customer_address_province: true,
              customer_address_default: true,
              customer_address_created_at: true,
              customer_address_updated_at: true,
            },
            orderBy: [
              { customer_address_default: 'desc' },
              { customer_address_created_at: 'desc' },
            ],
          },
        },
        orderBy: {
          customer_created_at: 'desc',
        },
      });

      // 4. Chuyển BigInt thành string để JSON serialize được
      return customers.map((customer) => ({
        ...customer,
        customer_id: customer.customer_id.toString(),
        customer_user_id: customer.customer_user_id.toString(),

        addresses: customer.addresses.map((address) => ({
          ...address,
          customer_address_id:
            address.customer_address_id.toString(),
          customer_address_customer_id:
            address.customer_address_customer_id.toString(),
        })),
      }));
    } catch {
      throw new InternalServerErrorException(
        'Không thể lấy danh sách khách hàng.',
      );
    }
  }
}
