import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  HttpException,
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
  // CHECK PERMISSION
  // ======================================================

  private async checkPermission(
    accessToken: string,
    permissionName: string,
  ): Promise<void> {
    const userServiceUrl =
      process.env.USER_SERVICE_URL?.replace(/\/+$/, '');

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
            'Bạn không có quyền thực hiện thao tác này.',
          );
        }
      }

      throw new ServiceUnavailableException(
        'Không thể xác minh quyền truy cập từ user-service.',
      );
    }

    if (allowed !== true) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện thao tác này tại Kho 1.',
      );
    }
  }

  // ======================================================
  // 1. (GET) INVENTORY LIST
  // ======================================================

  async getInventoryList(
    accessToken: string,
    search?: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      'ware-house-1:read',
    );

    try {
      const keyword = search?.trim();

      // =========================================
      // 2. SERIAL CONDITION
      // =========================================

      const serialWhere: Prisma.InventorySkuSerialWhereInput = {
        inventory_id: this.inventoryId,

        inventory: {
          is: {
            inventory_branch_id: this.branchId,
          },
        },
      };

      // =========================================
      // 3. STOCK CONDITION
      // =========================================

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

      // =========================================
      // 4. QUERY INVENTORY STOCK
      // =========================================

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
      // 5. FORMAT RESPONSE DATA
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
      // 6. RETURN RESULT
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
  
  // ======================================================
  // 2. (POST) CREATE MULTIPLE INVENTORY SKUS
  // ======================================================

  async createInventorySkus(
    accessToken: string,
    skus: string[],
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      'ware-house-1-add-skus:create',
    );

    // =========================================
    // 2. VALIDATE SKU LIST
    // =========================================

    if (!Array.isArray(skus) || skus.length === 0) {
      throw new BadRequestException(
        'Danh sách SKU không được để trống.',
      );
    }

    if (skus.length > 500) {
      throw new BadRequestException(
        'Chỉ được thêm tối đa 500 SKU mỗi lần.',
      );
    }

    if (
      skus.some(
        (sku) =>
          typeof sku !== 'string' ||
          !sku.trim() ||
          sku.trim().length > 200,
      )
    ) {
      throw new BadRequestException(
        'Danh sách chứa mã SKU không hợp lệ.',
      );
    }

    // =========================================
    // 3. NORMALIZE AND REMOVE DUPLICATE INPUT
    // =========================================

    const normalizedSkus = skus.map(
      (sku) => sku.trim(),
    );

    const skuSet = new Set<string>();

    const skippedSkus: {
      sku: string;
      reason: string;
    }[] = [];

    for (const sku of normalizedSkus) {
      if (skuSet.has(sku)) {
        skippedSkus.push({
          sku,
          reason: 'Mã SKU bị lặp trong danh sách yêu cầu.',
        });

        continue;
      }

      skuSet.add(sku);
    }

    const uniqueSkus = [...skuSet].sort();

    try {
      // =========================================
      // 4. DATABASE TRANSACTION
      // =========================================

      const result = await this.prisma.$transaction(
        async (tx) => {

          // -------------------------------------
          // 4.1. CHECK WAREHOUSE 1
          // -------------------------------------

          const inventory =
            await tx.inventory.findFirst({
              where: {
                inventory_id: this.inventoryId,
                inventory_branch_id: this.branchId,
              },

              select: {
                inventory_id: true,
                inventory_branch_id: true,
              },
            });

          if (!inventory) {
            throw new NotFoundException(
              'Không tìm thấy Kho 1.',
            );
          }

          // -------------------------------------
          // 4.2. CREATE MISSING INVENTORY SKUS
          // -------------------------------------

          // SKU đã tồn tại trong inventory_sku
          // sẽ được tự động bỏ qua.

          await tx.inventorySku.createMany({
            data: uniqueSkus.map((skuCode) => ({
              inventory_sku_code: skuCode,
            })),

            skipDuplicates: true,
          });

          // -------------------------------------
          // 4.3. GET INVENTORY SKU IDS
          // -------------------------------------

          const inventorySkus =
            await tx.inventorySku.findMany({
              where: {
                inventory_sku_code: {
                  in: uniqueSkus,
                },
              },

              select: {
                inventory_sku_id: true,
                inventory_sku_code: true,
              },

              orderBy: {
                inventory_sku_id: 'asc',
              },
            });

          // -------------------------------------
          // 4.4. BULK CREATE INVENTORY STOCK
          // -------------------------------------

          // Khóa chính kết hợp:
          // inventory_id + inventory_sku_id
          //
          // Nếu SKU đã tồn tại trong Kho 1,
          // skipDuplicates sẽ bỏ qua bản ghi đó.

          const createdStocks =
            await tx.inventoryStock.createManyAndReturn({
              data: inventorySkus.map((sku) => ({
                inventory_id: this.inventoryId,

                inventory_sku_id:
                  sku.inventory_sku_id,

                inventory_stock_quantity: 0,
              })),

              skipDuplicates: true,

              select: {
                inventory_sku_id: true,
              },
            });

          // -------------------------------------
          // 4.5. IDENTIFY CREATED AND SKIPPED SKUS
          // -------------------------------------

          const createdSkuIds = new Set(
            createdStocks.map(
              (stock) => stock.inventory_sku_id,
            ),
          );

          for (const sku of inventorySkus) {
            if (
              !createdSkuIds.has(
                sku.inventory_sku_id,
              )
            ) {
              skippedSkus.push({
                sku: sku.inventory_sku_code,

                reason:
                  'SKU đã tồn tại trong Kho 1.',
              });
            }
          }

          // -------------------------------------
          // 4.6. GET NEWLY CREATED STOCK DETAILS
          // -------------------------------------

          const stocks =
            await tx.inventoryStock.findMany({
              where: {
                inventory_id: this.inventoryId,

                inventory: {
                  is: {
                    inventory_branch_id:
                      this.branchId,
                  },
                },

                inventory_sku_id: {
                  in: [...createdSkuIds],
                },
              },

              select: {
                inventory_id: true,
                inventory_sku_id: true,
                inventory_stock_quantity: true,

                sku: {
                  select: {
                    inventory_sku_code: true,

                    serials: {
                      where: {
                        inventory_id:
                          this.inventoryId,
                      },

                      select: {
                        inventory_sku_serial_id: true,
                        inventory_sku_serial_number: true,
                        inventory_sku_serial_status_id: true,

                        inventory_id: true,
                        inventory_sku_id: true,

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

          // -------------------------------------
          // 4.7. FORMAT CREATED STOCKS
          // -------------------------------------

          const createdStockDetails = stocks.map(
            (stock) => {
              const serials = stock.sku.serials;

              return {
                inventory_id: stock.inventory_id,

                inventory_branch_id:
                  inventory.inventory_branch_id,

                inventory_sku_id:
                  stock.inventory_sku_id,

                inventory_sku_code:
                  stock.sku.inventory_sku_code,

                inventory_stock_quantity:
                  stock.inventory_stock_quantity,

                serial_statistics: {
                  total: serials.length,

                  available: serials.filter(
                    (serial) =>
                      serial.status
                        .inventory_sku_serial_status_code ===
                      'AVAILABLE',
                  ).length,

                  reserved: serials.filter(
                    (serial) =>
                      serial.status
                        .inventory_sku_serial_status_code ===
                      'RESERVED',
                  ).length,

                  cancelled: serials.filter(
                    (serial) =>
                      serial.status
                        .inventory_sku_serial_status_code ===
                      'CANCELLED',
                  ).length,

                  sold: serials.filter(
                    (serial) =>
                      serial.status
                        .inventory_sku_serial_status_code ===
                      'SOLD',
                  ).length,
                },

                serials,
              };
            },
          );

          // -------------------------------------
          // 4.8. RETURN TRANSACTION RESULT
          // -------------------------------------

          return {
            total_requested: normalizedSkus.length,

            total_created: createdStockDetails.length,

            total_skipped: skippedSkus.length,

            created_skus: createdStockDetails.map(
              (stock) => stock.inventory_sku_code,
            ),

            created_stocks: createdStockDetails,

            skipped_skus: skippedSkus,
          };
        },

        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.ReadCommitted,

          timeout: 15000,
        },
      );

      // =========================================
      // 5. RETURN RESPONSE
      // =========================================

      return {
        success: true,

        message:
          `Đã thêm ${result.total_created} SKU vào Kho 1, ` +
          `bỏ qua ${result.total_skipped} SKU.`,

        data: result,
      };

    } catch (error) {
      // =========================================
      // 6. HANDLE HTTP EXCEPTION
      // =========================================

      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        'CREATE MULTIPLE WAREHOUSE 1 SKUS ERROR:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể thêm danh sách SKU vào Kho 1.',
      );
    }
  }
}