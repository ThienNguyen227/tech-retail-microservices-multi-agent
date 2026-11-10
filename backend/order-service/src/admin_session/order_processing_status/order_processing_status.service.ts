
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';

import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderProcessingStatusService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // 1. (PATCH) UPDATE ORDER PROCESSING STATUS
  async updateOrderProcessingStatus(
    accessToken: string,
    orderId: number,
    processingStatus: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION THROUGH USER-SERVICE
    // =========================================

    const userServiceUrl =
      process.env.USER_SERVICE_URL || 'http://user-service:3001';

    let allowed: boolean;

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'order-processing-status:update',
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
        'Bạn không có quyền cập nhật trạng thái xử lý đơn hàng.',
      );
    }

    // =========================================
    // 2. UPDATE ORDER PROCESSING STATUS
    // =========================================

    try {
      const updatedOrder = await this.prisma.$transaction(
        async (tx) => {
          // -------------------------------------
          // 2.1. CHECK ORDER EXIST
          // -------------------------------------

          const order = await tx.order.findUnique({
            where: {
              order_id: orderId,
            },
          });

          if (!order) {
            throw new NotFoundException(
              'Không tìm thấy đơn hàng.',
            );
          }

          // -------------------------------------
          // 2.2. CHECK PROCESSING STATUS EXIST
          // -------------------------------------

          const targetStatus =
            await tx.orderProcessingStatus.findUnique({
              where: {
                order_processing_status_code: processingStatus,
              },
            });

          if (!targetStatus) {
            throw new BadRequestException(
              'Trạng thái xử lý đơn hàng không tồn tại trong hệ thống.',
            );
          }

          // -------------------------------------
          // 2.3. UPDATE ORDER
          // -------------------------------------

          return await tx.order.update({
            where: {
              order_id: orderId,
            },

            data: {
              order_order_processing_status_id:
                targetStatus.order_processing_status_id,
            },

            include: {
              // Processing Status
              order_processing_status: {
                select: {
                  order_processing_status_id: true,
                  order_processing_status_code: true,
                  order_processing_status_name: true,
                },
              },

              // Payment Status
              order_payment_status: {
                select: {
                  order_payment_status_id: true,
                  order_payment_status_code: true,
                  order_payment_status_name: true,
                },
              },

              // Delivery Method
              order_delivery_method: {
                select: {
                  delivery_method_id: true,
                  delivery_method_code: true,
                  delivery_method_name: true,
                },
              },

              // Payment Method
              order_payment_method: {
                select: {
                  payment_method_id: true,
                  payment_method_code: true,
                  payment_method_name: true,
                  payment_method_status: true,
                },
              },

              // Order Items
              order_item: {
                orderBy: {
                  order_item_id: 'asc',
                },
              },
            },
          });
        },
      );

      // =========================================
      // 3. RETURN RESULT
      // =========================================

      return {
        success: true,
        message: 'Cập nhật trạng thái xử lý đơn hàng thành công.',
        data: updatedOrder,
      };
    } catch (error) {
      // Giữ nguyên các HTTP exception đã xử lý
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        'UPDATE ORDER PROCESSING STATUS ERROR:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể cập nhật trạng thái xử lý đơn hàng.',
      );
    }
  }
}
