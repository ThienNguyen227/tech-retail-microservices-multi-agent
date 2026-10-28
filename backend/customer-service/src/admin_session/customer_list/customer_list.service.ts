import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetCustomerListDto } from '../dto/get_customer_list/get_customer_list.dto';
import { UpdateCustomerListDto } from '../dto/update_customer_list/update_customer_list.dto';

@Injectable()
export class CustomerListService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (GET) CUSTOMER-LIST
  async getCustomerList(filters: GetCustomerListDto, accessToken: string) {
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
 
  // 2. (PATCH) CUSTOMER-LIST
  async updateCustomerList(customerId: string, dto: UpdateCustomerListDto, accessToken: string) {
    // 1. Kiểm tra ID
    if (!/^[1-9]\d*$/.test(customerId)) {
      throw new BadRequestException('ID khách hàng không hợp lệ.');
    }

    const id = BigInt(customerId);

    // 2. Kiểm tra dữ liệu cập nhật
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Vui lòng cung cấp ít nhất một trường cần cập nhật.',
      );
    }

    // 3. Kiểm tra quyền thông qua user-service
    const userServiceUrl = 'http://localhost:3001';

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'customer-list:update',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        },
      );

      if (response.data.allowed !== true) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật thông tin khách hàng!',
        );
      }
    } catch (error) {
      if (
        error instanceof ForbiddenException
      ) {
        throw error;
      }

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

    // 4. Kiểm tra khách hàng tồn tại
    const existingCustomer = await this.prisma.customer.findUnique({
      where: {
        customer_id: id,
      },
      select: {
        customer_id: true,
      },
    });

    if (!existingCustomer) {
      throw new NotFoundException('Không tìm thấy khách hàng.');
    }

    // 5. Chuẩn bị dữ liệu cập nhật
    const data: Prisma.CustomerUpdateInput = {};

    if (dto.customer_code !== undefined) {
      data.customer_code = dto.customer_code.trim();
    }

    if (dto.customer_full_name !== undefined) {
      data.customer_full_name = dto.customer_full_name.trim();
    }

    if (dto.customer_date_of_birth !== undefined) {
      const dob = new Date(dto.customer_date_of_birth);

      if (Number.isNaN(dob.getTime())) {
        throw new BadRequestException('Ngày sinh không hợp lệ.');
      }

      if (dob > new Date()) {
        throw new BadRequestException(
          'Ngày sinh không được lớn hơn ngày hiện tại.',
        );
      }

      data.customer_date_of_birth = dob;
    }

    if (dto.customer_gender !== undefined) {
      data.customer_gender = dto.customer_gender;
    }

    if (dto.customer_status !== undefined) {
      data.customer_status = dto.customer_status;
    }

    // 6. Cập nhật khách hàng
    try {
      const customer = await this.prisma.customer.update({
        where: {
          customer_id: id,
        },
        data,
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
        },
      });

      // BigInt phải được chuyển thành string trước khi trả JSON
      return {
        message: 'Cập nhật thông tin khách hàng thành công!',
        data: {
          ...customer,
          customer_id: customer.customer_id.toString(),
          customer_user_id: customer.customer_user_id.toString(),
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Mã khách hàng đã tồn tại!',
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException('Không tìm thấy khách hàng!');
        }
      }

      throw new InternalServerErrorException(
        'Không thể cập nhật thông tin khách hàng!',
      );
    }
  }
}
