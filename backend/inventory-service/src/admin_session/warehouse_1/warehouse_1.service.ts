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
export class Warehouse1Service {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ======================================================
  // WAREHOUSE 1 CONFIGURATION
  // ======================================================

  private readonly inventoryId = 1;
  private readonly branchId = 1;

  // ======================================================
  // 1. (GET) INVENTORY LIST
  // ======================================================

  async getInventoryList(
    accessToken: string,
    search?: string,
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
      const response = await axios.post<{
        allowed: boolean;
      }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'ware-house-1:read',
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
        'Bạn không có quyền xem thông tin Kho 1.',
      );
    }

    // =========================================
    // 2. GET WAREHOUSE 1 INVENTORY LIST
    // =========================================

    try {
      const keyword = search?.trim();

      // -------------------------------------
      // 2.1. SERIAL CONDITION
      // -------------------------------------

      const serialWhere: Prisma.InventorySkuSerialWhereInput = {
        inventory_id: this.inventoryId,

        inventory: {
          is: {
            inventory_branch_id: this.branchId,
          },
        },
      };

      // -------------------------------------
      // 2.2. STOCK CONDITION
      // -------------------------------------

      const where: Prisma.InventoryStockWhereInput = {
        // Cố định Kho 1
        inventory_id: this.inventoryId,

        // Cố định chi nhánh 1
        inventory: {
          is: {
            inventory_branch_id: this.branchId,
          },
        },

        // Tìm kiếm theo mã SKU hoặc Serial Number
        ...(keyword && {
          sku: {
            is: {
              OR: [
                // Tìm theo mã SKU
                {
                  inventory_sku_code: {
                    contains: keyword,
                    mode: 'insensitive',
                  },
                },

                // Tìm theo Serial Number thuộc Kho 1
                {
                  serials: {
                    some: {
                      ...serialWhere,

                      inventory_sku_serial_number: {
                        contains: keyword,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            },
          },
        }),
      };

      // -------------------------------------
      // 2.3. QUERY INVENTORY STOCK
      // -------------------------------------

      const stocks =
        await this.prisma.inventoryStock.findMany({
          where,

          select: {
            inventory_id: true,
            inventory_sku_id: true,
            inventory_stock_quantity: true,

            // Thông tin SKU
            sku: {
              select: {
                inventory_sku_id: true,
                inventory_sku_code: true,

                // Danh sách Serial thuộc SKU tại Kho 1
                serials: {
                  where: serialWhere,

                  select: {
                    inventory_sku_serial_id: true,
                    inventory_sku_serial_number: true,
                    inventory_sku_serial_status_id: true,

                    inventory_id: true,
                    inventory_sku_id: true,

                    // Trạng thái Serial Number
                    status: {
                      select: {
                        inventory_sku_serial_status_id: true,
                        inventory_sku_serial_status_code: true,
                        inventory_sku_serial_status_name: true,
                      },
                    },
                  },

                  orderBy: {
                    inventory_sku_serial_id: 'asc',
                  },
                },
              },
            },
          },

          orderBy: {
            inventory_sku_id: 'asc',
          },
        });

      // =========================================
      // 3. FORMAT RESPONSE DATA
      // =========================================

      const data = stocks.map((stock) => {
        const serials = stock.sku.serials;

        // Số Serial có sẵn
        const availableSerials = serials.filter(
          (serial) =>
            serial.status.inventory_sku_serial_status_code ===
            'AVAILABLE',
        ).length;

        // Số Serial đã đặt
        const reservedSerials = serials.filter(
          (serial) =>
            serial.status.inventory_sku_serial_status_code ===
            'RESERVED',
        ).length;

        // Số Serial đã hủy đặt
        const cancelledSerials = serials.filter(
          (serial) =>
            serial.status.inventory_sku_serial_status_code ===
            'CANCELLED',
        ).length;

        // Số Serial đã bán
        const soldSerials = serials.filter(
          (serial) =>
            serial.status.inventory_sku_serial_status_code ===
            'SOLD',
        ).length;

        return {
          inventory_id: stock.inventory_id,

          inventory_branch_id: this.branchId,

          inventory_sku_id: stock.inventory_sku_id,

          inventory_sku_code:
            stock.sku.inventory_sku_code,

          inventory_stock_quantity:
            stock.inventory_stock_quantity,

          // Thống kê Serial của SKU
          serial_statistics: {
            total: serials.length,
            available: availableSerials,
            reserved: reservedSerials,
            cancelled: cancelledSerials,
            sold: soldSerials,
          },

          // Danh sách Serial Number
          serials,
        };
      });

      // =========================================
      // 4. RETURN RESULT
      // =========================================

      return {
        success: true,
        message: 'Lấy danh sách tồn kho Kho 1 thành công.',
        total: data.length,
        data,
      };

    } catch (error) {
      console.error(
        'GET WAREHOUSE 1 INVENTORY LIST ERROR:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể lấy danh sách tồn kho Kho 1.',
      );
    }
  }
}