import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarrantyListService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (GET) WARRANTY-LIST
  async getWarrantyList(
    accessToken: string,
    search?: string,
    status?: string,
  ) {
    // 1. Kiểm tra quyền thông qua user-service
    const userServiceUrl = 'http://localhost:3001';

    let allowed: boolean;

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'warranty-list:read',
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
        'Bạn không có quyền xem danh sách bảo hành.',
      );
    }

    try {
      const keyword = search?.trim();

      const where: any = {
        ...(keyword && {
          OR: [
            {
              warranty_code: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              order_code: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              warranty_product_name: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              warranty_sku: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              warranty_serial_number: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          ],
        }),

        ...(status && {
          status: {
            is: {
              warranty_status_code: status,
            },
          },
        }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.warranty.findMany({
          where,
          include: {
            status: {
              select: {
                warranty_status_id: true,
                warranty_status_code: true,
                warranty_status_name: true,
              },
            },
            requests: {
              include: {
                type: {
                  select: {
                    warranty_request_type_id: true,
                    warranty_request_type_code: true,
                    warranty_request_type_name: true,
                  },
                },
                status: {
                  select: {
                    warranty_request_status_id: true,
                    warranty_request_status_code: true,
                    warranty_request_status_name: true,
                  },
                },
              },
              orderBy: {
                warranty_request_created_at: 'desc',
              },
            },
          },
          orderBy: {
            warranty_created_at: 'desc',
          },
        }),

        this.prisma.warranty.count({
          where,
        }),
      ]);

      // =========================================
      // 3. RETURN RESULT
      // =========================================
      return {
        success: true,
        message: 'Lấy danh sách bảo hành thành công.',
        total,
        data,
      };
    } catch (error) {
      console.error('GET WARRANTY LIST ERROR:', error);

      throw new InternalServerErrorException(
        'Không thể lấy danh sách bảo hành.',
      );
    }
  }
}