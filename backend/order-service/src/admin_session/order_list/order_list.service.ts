import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
  HttpException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import axios from 'axios';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

interface UpdateOrderInput {
  // RECIPIENT INFORMATION
  order_recipient_name?: string;
  order_recipient_phone?: string;
  order_address_line?: string;
  order_ward?: string;
  order_province?: string;

  // DELIVERY AND PAYMENT METHOD
  order_order_delivery_method_id?: number;
  order_order_payment_method_id?: number;

  // COUPON
  order_coupon_id?: number | null;
  order_coupon_name?: string | null;
  order_coupon_discount_amount?: number | string | null;

  // ORDER AMOUNT
  order_subtotal?: number | string;
  order_shipping_fee?: number | string;
  order_discount_amount?: number | string;
  order_total_amount?: number | string;
}

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


  // 2. (PATCH) UPDATE ORDER
  async updateOrder(
    accessToken: string,
    orderId: number,
    body: UpdateOrderInput,
  ) {
    // =========================================
    // 1. CHECK PERMISSION THROUGH USER-SERVICE
    // =========================================

    const userServiceUrl = process.env.USER_SERVICE_URL;

    if (!userServiceUrl) {
      throw new ServiceUnavailableException(
        'USER_SERVICE_URL chưa được cấu hình.',
      );
    }

    let allowed: boolean;

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'order-list:update',
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
        'Bạn không có quyền chỉnh sửa thông tin đơn hàng.',
      );
    }

    // =========================================
    // 2. UPDATE ORDER
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
            include: {
              order_payment_status: {
                select: {
                  order_payment_status_code: true,
                },
              },
            },
          });

          if (!order) {
            throw new NotFoundException(
              'Không tìm thấy đơn hàng.',
            );
          }

          // -------------------------------------
          // 2.2. CHECK DELIVERY METHOD
          // -------------------------------------

          if (
            body.order_order_delivery_method_id !== undefined
          ) {
            const deliveryMethod =
              await tx.orderDeliveryMethod.findUnique({
                where: {
                  delivery_method_id:
                    body.order_order_delivery_method_id,
                },
              });

            if (!deliveryMethod) {
              throw new BadRequestException(
                'Phương thức giao hàng không tồn tại.',
              );
            }
          }

          // -------------------------------------
          // 2.3. CHECK PAYMENT METHOD
          // -------------------------------------

          if (
            body.order_order_payment_method_id !== undefined
          ) {
            const paymentMethod =
              await tx.orderPaymentMethod.findUnique({
                where: {
                  payment_method_id:
                    body.order_order_payment_method_id,
                },
              });

            if (!paymentMethod) {
              throw new BadRequestException(
                'Phương thức thanh toán không tồn tại.',
              );
            }

            if (!paymentMethod.payment_method_status) {
              throw new BadRequestException(
                'Phương thức thanh toán hiện không hoạt động.',
              );
            }

            // Không thay đổi phương thức thanh toán
            // nếu đơn hàng đã thanh toán hoặc hoàn tiền.

            const paymentStatus =
              order.order_payment_status
                .order_payment_status_code;

            const isPaymentFinal = [
              'PAID',
              'REFUNDED',
            ].includes(paymentStatus);

            if (
              isPaymentFinal &&
              body.order_order_payment_method_id !==
                order.order_order_payment_method_id
            ) {
              throw new BadRequestException(
                'Không thể thay đổi phương thức thanh toán của đơn hàng đã thanh toán hoặc hoàn tiền.',
              );
            }
          }

          // -------------------------------------
          // 2.4. BUILD UPDATE DATA
          // -------------------------------------

          const updateData: Prisma.OrderUncheckedUpdateInput = {};

          // Recipient
          if (body.order_recipient_name !== undefined) {
            updateData.order_recipient_name =
              body.order_recipient_name;
          }

          if (body.order_recipient_phone !== undefined) {
            updateData.order_recipient_phone =
              body.order_recipient_phone;
          }

          // Address
          if (body.order_address_line !== undefined) {
            updateData.order_address_line =
              body.order_address_line;
          }

          if (body.order_ward !== undefined) {
            updateData.order_ward = body.order_ward;
          }

          if (body.order_province !== undefined) {
            updateData.order_province =
              body.order_province;
          }

          // Delivery method
          if (
            body.order_order_delivery_method_id !== undefined
          ) {
            updateData.order_order_delivery_method_id =
              body.order_order_delivery_method_id;
          }

          // Payment method
          if (
            body.order_order_payment_method_id !== undefined
          ) {
            updateData.order_order_payment_method_id =
              body.order_order_payment_method_id;
          }

          // Coupon
          if (body.order_coupon_id !== undefined) {
            updateData.order_coupon_id =
              body.order_coupon_id;
          }

          if (body.order_coupon_name !== undefined) {
            updateData.order_coupon_name =
              body.order_coupon_name;
          }

          if (
            body.order_coupon_discount_amount !== undefined
          ) {
            updateData.order_coupon_discount_amount =
              body.order_coupon_discount_amount;
          }

          // Order amount
          if (body.order_subtotal !== undefined) {
            updateData.order_subtotal =
              body.order_subtotal;
          }

          if (body.order_shipping_fee !== undefined) {
            updateData.order_shipping_fee =
              body.order_shipping_fee;
          }

          if (body.order_discount_amount !== undefined) {
            updateData.order_discount_amount =
              body.order_discount_amount;
          }

          if (body.order_total_amount !== undefined) {
            updateData.order_total_amount =
              body.order_total_amount;
          }

          // -------------------------------------
          // 2.5. UPDATE ORDER
          // -------------------------------------

          return await tx.order.update({
            where: {
              order_id: orderId,
            },

            data: updateData,

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
        message: 'Cập nhật thông tin đơn hàng thành công.',
        data: updatedOrder,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('UPDATE ORDER ERROR:', error);

      throw new InternalServerErrorException(
        'Không thể cập nhật thông tin đơn hàng.',
      );
    }
  }

}
