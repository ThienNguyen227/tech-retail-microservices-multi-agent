
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';

import axios from 'axios';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderListService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // 1. (GET) ORDER-LIST
  async getOrderList(
    accessToken: string,
    search?: string,
    processingStatus?: string,
    paymentStatus?: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION THROUGH USER-SERVICE
    // =========================================

    const userServiceUrl = process.env.USER_SERVICE_URL;

    let allowed: boolean;

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'order-list:read',
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
        'Bạn không có quyền xem danh sách đơn hàng.',
      );
    }

    // =========================================
    // 2. GET ORDER LIST
    // =========================================

    try {
      const keyword = search?.trim();

      const where: Prisma.OrderWhereInput = {
        // Tìm kiếm đơn hàng
        ...(keyword && {
          OR: [
            // Mã đơn hàng
            {
              order_code: {
                contains: keyword,
                mode: 'insensitive',
              },
            },

            // Tên người nhận
            {
              order_recipient_name: {
                contains: keyword,
                mode: 'insensitive',
              },
            },

            // Số điện thoại người nhận
            {
              order_recipient_phone: {
                contains: keyword,
                mode: 'insensitive',
              },
            },

            // Địa chỉ giao hàng
            {
              order_address_line: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              order_ward: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              order_province: {
                contains: keyword,
                mode: 'insensitive',
              },
            },

            // Tìm theo SKU hoặc tên sản phẩm
            {
              order_item: {
                some: {
                  OR: [
                    {
                      order_item_sku: {
                        contains: keyword,
                        mode: 'insensitive',
                      },
                    },
                    {
                      order_item_product_name: {
                        contains: keyword,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            },
          ],
        }),

        // Lọc trạng thái xử lý đơn hàng
        ...(processingStatus && {
          order_processing_status: {
            is: {
              order_processing_status_code: processingStatus,
            },
          },
        }),

        // Lọc trạng thái thanh toán
        ...(paymentStatus && {
          order_payment_status: {
            is: {
              order_payment_status_code: paymentStatus,
            },
          },
        }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where,

          include: {
            // Trạng thái xử lý đơn hàng
            order_processing_status: {
              select: {
                order_processing_status_id: true,
                order_processing_status_code: true,
                order_processing_status_name: true,
              },
            },

            // Trạng thái thanh toán
            order_payment_status: {
              select: {
                order_payment_status_id: true,
                order_payment_status_code: true,
                order_payment_status_name: true,
              },
            },

            // Phương thức giao hàng
            order_delivery_method: {
              select: {
                delivery_method_id: true,
                delivery_method_code: true,
                delivery_method_name: true,
              },
            },

            // Phương thức thanh toán
            order_payment_method: {
              select: {
                payment_method_id: true,
                payment_method_code: true,
                payment_method_name: true,
                payment_method_status: true,
              },
            },

            // Danh sách sản phẩm trong đơn hàng
            order_item: {
              orderBy: {
                order_item_id: 'asc',
              },
            },
          },

          // Đơn hàng mới nhất hiển thị trước
          orderBy: {
            order_created_at: 'desc',
          },
        }),

        this.prisma.order.count({
          where,
        }),
      ]);

      // =========================================
      // 3. RETURN RESULT
      // =========================================

      return {
        success: true,
        message: 'Lấy danh sách đơn hàng thành công.',
        total,
        data,
      };
    } catch (error) {
      console.error('GET ORDER LIST ERROR:', error);

      throw new InternalServerErrorException(
        'Không thể lấy danh sách đơn hàng.',
      );
    }
  }
}
