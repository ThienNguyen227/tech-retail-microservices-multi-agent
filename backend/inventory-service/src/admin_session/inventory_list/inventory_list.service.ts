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
export class InventoryListService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ======================================================
  // CHECK PERMISSION THROUGH USER-SERVICE
  // ======================================================

  private async checkPermission(
    accessToken: string,
    permissionName: string,
  ): Promise<void> {
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
          permission_name: permissionName,
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
        'Bạn không có quyền truy cập thông tin kho hàng.',
      );
    }
  }

  // ======================================================
  // 1. (GET) INVENTORY-LIST
  // ======================================================

  async getInventoryList(
    accessToken: string,
    search?: string,
    branchId?: number,
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      'inventory-list:read',
    );

    // =========================================
    // 2. GET INVENTORY LIST
    // =========================================

    try {
      const keyword = search?.trim();

      const stockWhere: Prisma.InventoryStockWhereInput = {
        ...(keyword && {
          sku: {
            is: {
              inventory_sku_code: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          },
        }),
      };

      const where: Prisma.InventoryWhereInput = {
        // Lọc theo chi nhánh
        ...(branchId !== undefined && {
          inventory_branch_id: branchId,
        }),

        // Tìm kiếm kho chứa SKU tương ứng
        ...(keyword && {
          stocks: {
            some: stockWhere,
          },
        }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.inventory.findMany({
          where,

          include: {
            // Danh sách tồn kho theo SKU
            stocks: {
              where: stockWhere,

              include: {
                sku: {
                  select: {
                    inventory_sku_id: true,
                    inventory_sku_code: true,
                  },
                },
              },

              orderBy: {
                inventory_sku_id: 'asc',
              },
            },
          },

          orderBy: {
            inventory_id: 'asc',
          },
        }),

        this.prisma.inventory.count({
          where,
        }),
      ]);

      // =========================================
      // 3. CALCULATE STOCK SUMMARY
      // =========================================

      const result = data.map((inventory) => ({
        ...inventory,

        total_skus: inventory.stocks.length,

        total_stock_quantity: inventory.stocks.reduce(
          (totalQuantity, stock) =>
            totalQuantity + stock.inventory_stock_quantity,
          0,
        ),
      }));

      // =========================================
      // 4. RETURN RESULT
      // =========================================

      return {
        success: true,
        message: 'Lấy danh sách kho hàng thành công.',
        total,
        data: result,
      };

    } catch (error) {
      console.error('GET INVENTORY LIST ERROR:', error);

      throw new InternalServerErrorException(
        'Không thể lấy danh sách kho hàng.',
      );
    }
  }

  // ======================================================
  // 2. (GET) INVENTORY-SERIAL-LIST
  // ======================================================

  async getInventorySerialList(
    accessToken: string,
    search?: string,
    branchId?: number,
    inventoryId?: number,
    sku?: string,
    status?: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      'inventory-list:read',
    );

    // =========================================
    // 2. GET INVENTORY SERIAL LIST
    // =========================================

    try {
      const keyword = search?.trim();
      const skuCode = sku?.trim();

      const where: Prisma.InventorySkuSerialWhereInput = {
        // Tìm kiếm Serial Number hoặc SKU
        ...(keyword && {
          OR: [
            {
              inventory_sku_serial_number: {
                contains: keyword,
                mode: 'insensitive',
              },
            },

            {
              sku: {
                is: {
                  inventory_sku_code: {
                    contains: keyword,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        }),

        // Lọc theo Inventory ID
        ...(inventoryId !== undefined && {
          inventory_id: inventoryId,
        }),

        // Lọc theo chi nhánh
        ...(branchId !== undefined && {
          inventory: {
            is: {
              inventory_branch_id: branchId,
            },
          },
        }),

        // Lọc theo SKU
        ...(skuCode && {
          sku: {
            is: {
              inventory_sku_code: {
                equals: skuCode,
                mode: 'insensitive',
              },
            },
          },
        }),

        // Lọc theo trạng thái Serial Number
        ...(status && {
          status: {
            is: {
              inventory_sku_serial_status_code: status,
            },
          },
        }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.inventorySkuSerial.findMany({
          where,

          include: {
            // Thông tin SKU
            sku: {
              select: {
                inventory_sku_id: true,
                inventory_sku_code: true,
              },
            },

            // Trạng thái Serial Number
            status: {
              select: {
                inventory_sku_serial_status_id: true,
                inventory_sku_serial_status_code: true,
                inventory_sku_serial_status_name: true,
              },
            },

            // Thông tin kho
            inventory: {
              select: {
                inventory_id: true,
                inventory_branch_id: true,
              },
            },
          },

          orderBy: {
            inventory_sku_serial_id: 'desc',
          },
        }),

        this.prisma.inventorySkuSerial.count({
          where,
        }),
      ]);

      // =========================================
      // 3. RETURN RESULT
      // =========================================

      return {
        success: true,
        message: 'Lấy danh sách Serial Number thành công.',
        total,
        data,
      };

    } catch (error) {
      console.error(
        'GET INVENTORY SERIAL LIST ERROR:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể lấy danh sách Serial Number.',
      );
    }
  }

  // ======================================================
  // 3. (GET) INVENTORY-TRANSACTION-LIST
  // ======================================================

  async getInventoryTransactionList(
    accessToken: string,
    search?: string,
    branchId?: number,
    inventoryId?: number,
    transactionType?: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      'inventory-list:read',
    );

    // =========================================
    // 2. GET INVENTORY TRANSACTION LIST
    // =========================================

    try {
      const keyword = search?.trim();

      const where: Prisma.InventoryTransactionWhereInput = {
        // Tìm kiếm giao dịch kho
        ...(keyword && {
          OR: [
            // Nguồn hàng
            {
              inventory_transaction_from: {
                contains: keyword,
                mode: 'insensitive',
              },
            },

            // Đích đến
            {
              inventory_transaction_to: {
                contains: keyword,
                mode: 'insensitive',
              },
            },

            // Tìm kiếm theo SKU
            {
              items: {
                some: {
                  sku: {
                    is: {
                      inventory_sku_code: {
                        contains: keyword,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            },
          ],
        }),

        // Lọc theo kho
        ...(inventoryId !== undefined && {
          inventory_id: inventoryId,
        }),

        // Lọc theo chi nhánh
        ...(branchId !== undefined && {
          inventory: {
            is: {
              inventory_branch_id: branchId,
            },
          },
        }),

        // Lọc theo loại giao dịch
        ...(transactionType && {
          type: {
            is: {
              inventory_transaction_type_code: transactionType,
            },
          },
        }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.inventoryTransaction.findMany({
          where,

          include: {
            // Loại giao dịch
            type: {
              select: {
                inventory_transaction_type_id: true,
                inventory_transaction_type_code: true,
                inventory_transaction_type_name: true,
              },
            },

            // Thông tin kho
            inventory: {
              select: {
                inventory_id: true,
                inventory_branch_id: true,
              },
            },

            // Chi tiết giao dịch
            items: {
              include: {
                sku: {
                  select: {
                    inventory_sku_id: true,
                    inventory_sku_code: true,
                  },
                },
              },

              orderBy: {
                inventory_sku_id: 'asc',
              },
            },
          },

          // Giao dịch mới nhất hiển thị trước
          orderBy: {
            inventory_transaction_created_at: 'desc',
          },
        }),

        this.prisma.inventoryTransaction.count({
          where,
        }),
      ]);

      // =========================================
      // 3. RETURN RESULT
      // =========================================

      return {
        success: true,
        message: 'Lấy danh sách giao dịch kho thành công.',
        total,
        data,
      };

    } catch (error) {
      console.error(
        'GET INVENTORY TRANSACTION LIST ERROR:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể lấy danh sách giao dịch kho.',
      );
    }
  }
}