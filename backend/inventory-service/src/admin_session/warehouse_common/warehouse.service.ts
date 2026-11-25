import {
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

export interface WarehouseConfig {
  readonly inventoryId: number;
  readonly branchId: number;
  readonly warehouseName: string;
  readonly permissionPrefix: string;
}

// Logic nghiệp vụ dùng chung. Chỉ các Service con mới được NestJS inject.
export abstract class WarehouseService {
  protected constructor(
    private readonly prisma: PrismaService,
    private readonly config: Readonly<WarehouseConfig>,
  ) {}

  private get inventoryId(): number {
    return this.config.inventoryId;
  }

  private get branchId(): number {
    return this.config.branchId;
  }

  private get warehouseName(): string {
    return this.config.warehouseName;
  }

  private get permissionPrefix(): string {
    return this.config.permissionPrefix;
  }

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
        `Bạn không có quyền thực hiện thao tác này tại ${this.warehouseName}.`,
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
      `${this.permissionPrefix}:read`,
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
        // Cố định kho hiện tại
        inventory_id: this.inventoryId,

        // Cố định chi nhánh hiện tại
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

                // Tìm theo Serial Number thuộc kho hiện tại
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

                // Danh sách Serial thuộc SKU tại kho hiện tại
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
        message: `Lấy danh sách tồn kho ${this.warehouseName} thành công.`,
        total: data.length,
        data,
      };

    } catch (error) {
      console.error(
        `GET ${this.warehouseName} INVENTORY LIST ERROR:`,
        error,
      );

      throw new InternalServerErrorException(
        `Không thể lấy danh sách tồn kho ${this.warehouseName}.`,
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
      `${this.permissionPrefix}-add-skus:create`,
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
          // 4.1. CHECK WAREHOUSE
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
              `Không tìm thấy ${this.warehouseName}.`,
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
          // Nếu SKU đã tồn tại trong kho hiện tại,
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
                  `SKU đã tồn tại trong ${this.warehouseName}.`,
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
          `Đã thêm ${result.total_created} SKU vào ${this.warehouseName}, ` +
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
        `CREATE MULTIPLE ${this.warehouseName} SKUS ERROR:`,
        error,
      );

      throw new InternalServerErrorException(
        `Không thể thêm danh sách SKU vào ${this.warehouseName}.`,
      );
    }
  }

  // ======================================================
  // 3. (PATCH) UPDATE INVENTORY SKU
  // ======================================================

  async updateInventorySku(
    accessToken: string,
    skuId: number,
    sku: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      `${this.permissionPrefix}-update-sku:update`,
    );

    // =========================================
    // 2. VALIDATE INPUT
    // =========================================

    if (!Number.isSafeInteger(skuId) || skuId <= 0) {
      throw new BadRequestException(
        'SKU ID không hợp lệ.',
      );
    }

    if (typeof sku !== 'string') {
      throw new BadRequestException(
        'Mã SKU phải là chuỗi ký tự.',
      );
    }

    const newSkuCode = sku.trim();

    if (!newSkuCode) {
      throw new BadRequestException(
        'Mã SKU không được để trống.',
      );
    }

    if (newSkuCode.length > 200) {
      throw new BadRequestException(
        'Mã SKU tối đa 200 ký tự.',
      );
    }

    try {
      // =========================================
      // 3. DATABASE TRANSACTION
      // =========================================

      const result = await this.prisma.$transaction(
        async (tx) => {

          // -------------------------------------
          // 3.1. CHECK WAREHOUSE
          // -------------------------------------

          const inventory = await tx.inventory.findFirst({
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
              `Không tìm thấy ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 3.2. GET CURRENT SKU IN WAREHOUSE
          // -------------------------------------

          const currentStock =
            await tx.inventoryStock.findUnique({
              where: {
                inventory_id_inventory_sku_id: {
                  inventory_id: this.inventoryId,
                  inventory_sku_id: skuId,
                },
              },

              include: {
                sku: true,
              },
            });

          if (!currentStock) {
            throw new NotFoundException(
              `Không tìm thấy SKU trong ${this.warehouseName}.`,
            );
          }

          const oldSkuCode =
            currentStock.sku.inventory_sku_code;

          // -------------------------------------
          // 3.3. CHECK SAME SKU CODE
          // -------------------------------------

          if (oldSkuCode === newSkuCode) {
            throw new BadRequestException(
              'Mã SKU mới không khác mã SKU hiện tại.',
            );
          }

          // -------------------------------------
          // 3.4. CHECK STOCK QUANTITY
          // -------------------------------------

          if (currentStock.inventory_stock_quantity !== 0) {
            throw new ConflictException(
              `Không thể chỉnh sửa SKU "${oldSkuCode}" ` +
              'vì số lượng tồn kho khác 0.',
            );
          }

          // -------------------------------------
          // 3.5. CHECK EXISTING SERIALS
          // -------------------------------------

          const existingSerial =
            await tx.inventorySkuSerial.findFirst({
              where: {
                inventory_id: this.inventoryId,
                inventory_sku_id: skuId,
              },

              select: {
                inventory_sku_serial_id: true,
              },
            });

          if (existingSerial) {
            throw new ConflictException(
              `Không thể chỉnh sửa SKU "${oldSkuCode}" ` +
              `vì SKU đã có Serial Number trong ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 3.6. CHECK TRANSACTION HISTORY
          // -------------------------------------

          const existingTransaction =
            await tx.inventoryTransactionItem.findFirst({
              where: {
                inventory_sku_id: skuId,

                transaction: {
                  is: {
                    inventory_id: this.inventoryId,
                  },
                },
              },

              select: {
                inventory_transaction_id: true,
              },
            });

          if (existingTransaction) {
            throw new ConflictException(
              `Không thể chỉnh sửa SKU "${oldSkuCode}" ` +
              `vì SKU đã phát sinh giao dịch tại ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 3.7. CHECK NEW SKU IN SYSTEM
          // -------------------------------------

          let targetSku =
            await tx.inventorySku.findUnique({
              where: {
                inventory_sku_code: newSkuCode,
              },
            });

          // -------------------------------------
          // 3.8. CREATE NEW SKU IF NOT EXISTS
          // -------------------------------------

          if (!targetSku) {
            await tx.inventorySku.createMany({
              data: [
                {
                  inventory_sku_code: newSkuCode,
                },
              ],

              skipDuplicates: true,
            });

            targetSku =
              await tx.inventorySku.findUniqueOrThrow({
                where: {
                  inventory_sku_code: newSkuCode,
                },
              });
          }

          // -------------------------------------
          // 3.9. CHECK DUPLICATE SKU IN WAREHOUSE
          // -------------------------------------

          const duplicateStock =
            await tx.inventoryStock.findUnique({
              where: {
                inventory_id_inventory_sku_id: {
                  inventory_id: this.inventoryId,

                  inventory_sku_id:
                    targetSku.inventory_sku_id,
                },
              },
            });

          if (duplicateStock) {
            throw new ConflictException(
              `SKU "${newSkuCode}" đã tồn tại trong ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 3.10. CHECK TARGET SKU SERIALS
          // -------------------------------------

          const targetSerial =
            await tx.inventorySkuSerial.findFirst({
              where: {
                inventory_id: this.inventoryId,

                inventory_sku_id:
                  targetSku.inventory_sku_id,
              },

              select: {
                inventory_sku_serial_id: true,
              },
            });

          if (targetSerial) {
            throw new ConflictException(
              `SKU "${newSkuCode}" đã có dữ liệu Serial ` +
              `trong ${this.warehouseName}. Vui lòng kiểm tra lại dữ liệu.`,
            );
          }

          // -------------------------------------
          // 3.11. UPDATE INVENTORY STOCK
          // -------------------------------------

          // Chỉ thay đổi SKU ID trong InventoryStock.
          // Không thay đổi mã SKU dùng chung trong InventorySku.
          //
          // Kiểm tra lại số lượng tồn kho khi cập nhật.

          const updatedStock =
            await tx.inventoryStock.updateMany({
              where: {
                inventory_id: this.inventoryId,

                inventory_sku_id: skuId,

                inventory_stock_quantity: 0,
              },

              data: {
                inventory_sku_id:
                  targetSku.inventory_sku_id,
              },
            });

          if (updatedStock.count !== 1) {
            throw new ConflictException(
              'Dữ liệu SKU đã thay đổi. Vui lòng tải lại và thử lại.',
            );
          }

          // -------------------------------------
          // 3.12. FORMAT RESPONSE DATA
          // -------------------------------------

          return {
            old_inventory_sku_id: skuId,

            old_inventory_sku_code: oldSkuCode,

            inventory_id: inventory.inventory_id,

            inventory_branch_id:
              inventory.inventory_branch_id,

            inventory_sku_id:
              targetSku.inventory_sku_id,

            inventory_sku_code:
              targetSku.inventory_sku_code,

            inventory_stock_quantity: 0,

            serial_statistics: {
              total: 0,
              available: 0,
              reserved: 0,
              cancelled: 0,
              sold: 0,
            },

            serials: [],
          };
        },

        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,

          timeout: 15000,
        },
      );

      // =========================================
      // 4. RETURN RESPONSE
      // =========================================

      return {
        success: true,

        message:
          `Cập nhật SKU "${result.old_inventory_sku_code}" ` +
          `thành "${result.inventory_sku_code}" thành công.`,

        data: result,
      };

    } catch (error) {
      // =========================================
      // 5. HANDLE HTTP EXCEPTION
      // =========================================

      if (error instanceof HttpException) {
        throw error;
      }

      // =========================================
      // 6. HANDLE PRISMA ERROR
      // =========================================

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        // Trùng khóa chính hoặc unique constraint
        if (error.code === 'P2002') {
          throw new ConflictException(
            `SKU "${newSkuCode}" đã tồn tại trong ${this.warehouseName}.`,
          );
        }

        // Dữ liệu bị thay đổi đồng thời
        if (error.code === 'P2034' || error.code === 'P2025') {
          throw new ConflictException(
            'Dữ liệu kho đang được cập nhật bởi một thao tác khác. ' +
            'Vui lòng thử lại.',
          );
        }
      }

      // =========================================
      // 7. HANDLE DATABASE ERROR
      // =========================================

      console.error(
        `UPDATE ${this.warehouseName} SKU ERROR:`,
        error,
      );

      throw new InternalServerErrorException(
        `Không thể cập nhật SKU trong ${this.warehouseName}.`,
      );
    }
  }

  // ======================================================
  // 4. (POST) CREATE MULTIPLE INVENTORY SERIALS
  // ======================================================

  async createInventorySerials(
    accessToken: string,
    skuId: number,
    serialNumbers: string[],
    source?: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      `${this.permissionPrefix}-add-serials:create`,
    );

    // =========================================
    // 2. VALIDATE INPUT
    // =========================================

    if (!Number.isSafeInteger(skuId) || skuId <= 0) {
      throw new BadRequestException(
        'SKU ID không hợp lệ.',
      );
    }

    if (
      !Array.isArray(serialNumbers) ||
      serialNumbers.length === 0
    ) {
      throw new BadRequestException(
        'Danh sách Serial Number không được để trống.',
      );
    }

    if (serialNumbers.length > 500) {
      throw new BadRequestException(
        'Chỉ được thêm tối đa 500 Serial Number mỗi lần.',
      );
    }

    if (
      serialNumbers.some(
        (serial) =>
          typeof serial !== 'string' ||
          !serial.trim() ||
          serial.trim().length > 200,
      )
    ) {
      throw new BadRequestException(
        'Danh sách chứa Serial Number không hợp lệ.',
      );
    }

    if (
      source != null &&
      (
        typeof source !== 'string' ||
        source.trim().length > 255
      )
    ) {
      throw new BadRequestException(
        'Nguồn nhập hàng không hợp lệ.',
      );
    }

    // =========================================
    // 3. NORMALIZE AND REMOVE DUPLICATE INPUT
    // =========================================

    const normalizedSerials = serialNumbers.map(
      (serial) => serial.trim(),
    );

    const serialSet = new Set<string>();

    const skippedSerials: {
      serial_number: string;
      reason: string;
    }[] = [];

    for (const serial of normalizedSerials) {
      if (serialSet.has(serial)) {
        skippedSerials.push({
          serial_number: serial,
          reason: 'Serial Number bị lặp trong danh sách yêu cầu.',
        });

        continue;
      }

      serialSet.add(serial);
    }

    const uniqueSerials = [...serialSet].sort();

    try {
      // =========================================
      // 4. DATABASE TRANSACTION
      // =========================================

      const result = await this.prisma.$transaction(
        async (tx) => {

          // -------------------------------------
          // 4.1. CHECK WAREHOUSE
          // -------------------------------------

          const inventory =
            await tx.inventory.findFirst({
              where: {
                inventory_id: this.inventoryId,
                inventory_branch_id: this.branchId,
              },
            });

          if (!inventory) {
            throw new NotFoundException(
              `Không tìm thấy ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 4.2. CHECK SKU IN WAREHOUSE
          // -------------------------------------

          const stock =
            await tx.inventoryStock.findUnique({
              where: {
                inventory_id_inventory_sku_id: {
                  inventory_id: this.inventoryId,
                  inventory_sku_id: skuId,
                },
              },

              include: {
                sku: true,
              },
            });

          if (!stock) {
            throw new NotFoundException(
              `SKU chưa được đăng ký tại ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 4.3. GET AVAILABLE SERIAL STATUS
          // -------------------------------------

          const availableStatus =
            await tx.inventorySkuSerialStatus.findUnique({
              where: {
                inventory_sku_serial_status_code:
                  'AVAILABLE',
              },
            });

          if (!availableStatus) {
            throw new InternalServerErrorException(
              'Không tìm thấy trạng thái AVAILABLE.',
            );
          }

          // -------------------------------------
          // 4.4. GET IMPORT TRANSACTION TYPE
          // -------------------------------------

          const importType =
            await tx.inventoryTransactionType.findUnique({
              where: {
                inventory_transaction_type_code:
                  'IMPORT',
              },
            });

          if (!importType) {
            throw new InternalServerErrorException(
              'Không tìm thấy loại giao dịch IMPORT.',
            );
          }

          // -------------------------------------
          // 4.5. BULK CREATE SERIAL NUMBERS
          // -------------------------------------

          const createdSerials =
            await tx.inventorySkuSerial.createManyAndReturn({
              data: uniqueSerials.map((serialNumber) => ({
                inventory_sku_serial_number:
                  serialNumber,

                inventory_sku_serial_status_id:
                  availableStatus.inventory_sku_serial_status_id,

                inventory_sku_id: skuId,

                inventory_id: this.inventoryId,
              })),

              // Serial Number là UNIQUE trên toàn hệ thống.
              skipDuplicates: true,

              select: {
                inventory_sku_serial_id: true,
                inventory_sku_serial_number: true,
                inventory_sku_serial_status_id: true,
                inventory_sku_id: true,
                inventory_id: true,
              },
            });

          // -------------------------------------
          // 4.6. IDENTIFY DUPLICATE SERIAL NUMBERS
          // -------------------------------------

          const createdSerialSet = new Set(
            createdSerials.map(
              (serial) =>
                serial.inventory_sku_serial_number,
            ),
          );

          for (const serialNumber of uniqueSerials) {
            if (!createdSerialSet.has(serialNumber)) {
              skippedSerials.push({
                serial_number: serialNumber,

                reason:
                  'Serial Number đã tồn tại trong hệ thống.',
              });
            }
          }

          // -------------------------------------
          // 4.7. CALCULATE CREATED QUANTITY
          // -------------------------------------

          const createdQuantity = createdSerials.length;

          let quantityBefore =
            stock.inventory_stock_quantity;

          let quantityAfter = quantityBefore;

          let transactionId: number | null = null;

          // Chỉ cập nhật tồn kho và tạo giao dịch
          // khi thực sự có Serial Number mới.

          if (createdQuantity > 0) {

            // -----------------------------------
            // 4.8. UPDATE INVENTORY STOCK
            // -----------------------------------

            const updatedStock =
              await tx.inventoryStock.update({
                where: {
                  inventory_id_inventory_sku_id: {
                    inventory_id: this.inventoryId,
                    inventory_sku_id: skuId,
                  },
                },

                data: {
                  inventory_stock_quantity: {
                    increment: createdQuantity,
                  },
                },
              });

            quantityAfter =
              updatedStock.inventory_stock_quantity;

            quantityBefore =
              quantityAfter - createdQuantity;

            // -----------------------------------
            // 4.9. CREATE IMPORT TRANSACTION
            // -----------------------------------

            const inventoryTransaction =
              await tx.inventoryTransaction.create({
                data: {
                  inventory_id: this.inventoryId,

                  inventory_transaction_type_id:
                    importType.inventory_transaction_type_id,

                  inventory_transaction_from:
                    source?.trim() || null,

                  inventory_transaction_to:
                    `${this.warehouseName}`,

                  // -----------------------------
                  // 4.10. CREATE TRANSACTION ITEM
                  // -----------------------------

                  items: {
                    create: {
                      inventory_sku_id: skuId,

                      inventory_transaction_item_quantity:
                        createdQuantity,

                      inventory_transaction_item_before:
                        quantityBefore,

                      inventory_transaction_item_after:
                        quantityAfter,
                    },
                  },
                },
              });

            transactionId =
              inventoryTransaction.inventory_transaction_id;
          }

          // -------------------------------------
          // 4.11. FORMAT RESPONSE DATA
          // -------------------------------------

          return {
            inventory_id: inventory.inventory_id,

            inventory_branch_id:
              inventory.inventory_branch_id,

            inventory_sku_id: skuId,

            inventory_sku_code:
              stock.sku.inventory_sku_code,

            total_requested:
              normalizedSerials.length,

            total_created:
              createdQuantity,

            total_skipped:
              skippedSerials.length,

            inventory_stock_quantity_before:
              quantityBefore,

            inventory_stock_quantity_after:
              quantityAfter,

            inventory_transaction_id:
              transactionId,

            created_serials: createdSerials.map(
              (serial) => ({
                ...serial,

                status: {
                  inventory_sku_serial_status_id:
                    availableStatus.inventory_sku_serial_status_id,

                  inventory_sku_serial_status_code:
                    availableStatus.inventory_sku_serial_status_code,

                  inventory_sku_serial_status_name:
                    availableStatus.inventory_sku_serial_status_name,
                },
              }),
            ),

            skipped_serials: skippedSerials,
          };
        },

        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,

          timeout: 15000,
        },
      );

      // =========================================
      // 5. RETURN RESPONSE
      // =========================================

      return {
        success: true,

        message:
          `Đã thêm ${result.total_created} Serial Number ` +
          `cho SKU "${result.inventory_sku_code}", ` +
          `bỏ qua ${result.total_skipped} Serial Number.`,

        data: result,
      };

    } catch (error) {

      // =========================================
      // 6. HANDLE HTTP EXCEPTION
      // =========================================

      if (error instanceof HttpException) {
        throw error;
      }

      // =========================================
      // 7. HANDLE PRISMA ERROR
      // =========================================

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (
          error.code === 'P2034' ||
          error.code === 'P2025'
        ) {
          throw new ConflictException(
            'Dữ liệu kho đang được cập nhật bởi một thao tác khác. ' +
            'Vui lòng tải lại và thử lại.',
          );
        }

        if (error.code === 'P2002') {
          throw new ConflictException(
            'Phát hiện dữ liệu bị trùng. Vui lòng thử lại.',
          );
        }
      }

      // =========================================
      // 8. HANDLE DATABASE ERROR
      // =========================================

      console.error(
        `CREATE ${this.warehouseName} SERIAL NUMBERS ERROR:`,
        error,
      );

      throw new InternalServerErrorException(
        `Không thể thêm Serial Number vào ${this.warehouseName}.`,
      );
    }
  }

  // ======================================================
  // 5. (PATCH) UPDATE INVENTORY SERIAL NUMBER
  // ======================================================

  async updateInventorySerial(
    accessToken: string,
    serialId: number,
    serialNumber?: string,
    status?: 'AVAILABLE' | 'CANCELLED',
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      `${this.permissionPrefix}-update-serial:update`,
    );

    // =========================================
    // 2. VALIDATE INPUT
    // =========================================

    if (!Number.isSafeInteger(serialId) || serialId <= 0) {
      throw new BadRequestException(
        'Serial ID không hợp lệ.',
      );
    }

    if (
      serialNumber === undefined &&
      status === undefined
    ) {
      throw new BadRequestException(
        'Phải cung cấp ít nhất một trường cần cập nhật.',
      );
    }

    if (
      serialNumber !== undefined &&
      (
        typeof serialNumber !== 'string' ||
        !serialNumber.trim() ||
        serialNumber.trim().length > 200
      )
    ) {
      throw new BadRequestException(
        'Serial Number không hợp lệ.',
      );
    }

    if (
      status !== undefined &&
      !['AVAILABLE', 'CANCELLED'].includes(status)
    ) {
      throw new BadRequestException(
        'Trạng thái Serial Number không hợp lệ.',
      );
    }

    try {
      // =========================================
      // 3. DATABASE TRANSACTION
      // =========================================

      const result = await this.prisma.$transaction(
        async (tx) => {

          // -------------------------------------
          // 3.1. CHECK SERIAL IN WAREHOUSE
          // -------------------------------------

          const currentSerial =
            await tx.inventorySkuSerial.findFirst({
              where: {
                inventory_sku_serial_id: serialId,

                inventory_id: this.inventoryId,

                inventory: {
                  is: {
                    inventory_branch_id: this.branchId,
                  },
                },
              },

              include: {
                status: true,
                sku: true,
              },
            });

          if (!currentSerial) {
            throw new NotFoundException(
              `Không tìm thấy Serial Number trong ${this.warehouseName}.`,
            );
          }

          const skuId =
            currentSerial.inventory_sku_id;

          const oldSerialNumber =
            currentSerial.inventory_sku_serial_number;

          const oldStatusCode =
            currentSerial.status
              .inventory_sku_serial_status_code;

          // -------------------------------------
          // 3.2. CHECK RESERVED AND SOLD STATUS
          // -------------------------------------

          if (
            !['AVAILABLE', 'CANCELLED'].includes(
              oldStatusCode,
            )
          ) {
            throw new ConflictException(
              'Không thể chỉnh sửa Serial Number ' +
              'đang được đặt, đã bán hoặc có trạng thái không hỗ trợ.',
            );
          }

          // -------------------------------------
          // 3.3. PREPARE NEW VALUES
          // -------------------------------------

          const newSerialNumber =
            serialNumber?.trim() ?? oldSerialNumber;

          const newStatusCode =
            status ?? oldStatusCode;

          const serialChanged =
            newSerialNumber !== oldSerialNumber;

          const statusChanged =
            newStatusCode !== oldStatusCode;

          if (!serialChanged && !statusChanged) {
            throw new BadRequestException(
              'Không có dữ liệu nào được thay đổi.',
            );
          }

          // -------------------------------------
          // 3.4. LOCK INVENTORY STOCK
          // -------------------------------------

          // Khóa bản ghi tồn kho để hạn chế xung đột
          // với nghiệp vụ nhập hàng và đặt hàng.

          const lockedStocks = await tx.$queryRaw<
            { inventory_stock_quantity: number }[]
          >`
            SELECT inventory_stock_quantity
            FROM inventory_stock
            WHERE inventory_id = ${this.inventoryId}
            AND inventory_sku_id = ${skuId}
            FOR UPDATE
          `;

          if (lockedStocks.length === 0) {
            throw new NotFoundException(
              'Không tìm thấy dữ liệu tồn kho của SKU.',
            );
          }

          const quantityBefore =
            lockedStocks[0].inventory_stock_quantity;

          let quantityAfter = quantityBefore;

          // -------------------------------------
          // 3.5. CHECK DUPLICATE SERIAL NUMBER
          // -------------------------------------

          if (serialChanged) {
            const duplicateSerial =
              await tx.inventorySkuSerial.findUnique({
                where: {
                  inventory_sku_serial_number:
                    newSerialNumber,
                },
              });

            if (
              duplicateSerial &&
              duplicateSerial.inventory_sku_serial_id !==
                serialId
            ) {
              throw new ConflictException(
                `Serial Number "${newSerialNumber}" ` +
                'đã tồn tại trong hệ thống.',
              );
            }
          }

          // -------------------------------------
          // 3.6. GET NEW SERIAL STATUS
          // -------------------------------------

          const newStatus =
            await tx.inventorySkuSerialStatus.findUnique({
              where: {
                inventory_sku_serial_status_code:
                  newStatusCode,
              },
            });

          if (!newStatus) {
            throw new NotFoundException(
              `Không tìm thấy trạng thái "${newStatusCode}".`,
            );
          }

          // -------------------------------------
          // 3.7. CALCULATE STOCK ADJUSTMENT
          // -------------------------------------

          let quantityChange = 0;

          if (
            oldStatusCode === 'AVAILABLE' &&
            newStatusCode === 'CANCELLED'
          ) {
            quantityChange = -1;
          }

          if (
            oldStatusCode === 'CANCELLED' &&
            newStatusCode === 'AVAILABLE'
          ) {
            quantityChange = 1;
          }

          // -------------------------------------
          // 3.8. CHECK STOCK CONSISTENCY
          // -------------------------------------

          if (quantityChange !== 0) {
            const availableSerialCount =
              await tx.inventorySkuSerial.count({
                where: {
                  inventory_id: this.inventoryId,

                  inventory_sku_id: skuId,

                  status: {
                    is: {
                      inventory_sku_serial_status_code:
                        'AVAILABLE',
                    },
                  },
                },
              });

            if (quantityBefore !== availableSerialCount) {
              throw new ConflictException(
                'Số lượng tồn kho không khớp với số Serial AVAILABLE. ' +
                'Vui lòng kiểm tra lại dữ liệu kho.',
              );
            }
          }

          if (quantityBefore + quantityChange < 0) {
            throw new ConflictException(
              'Không thể cập nhật vì tồn kho sẽ bị âm.',
            );
          }

          // -------------------------------------
          // 3.9. UPDATE INVENTORY STOCK
          // -------------------------------------

          if (quantityChange !== 0) {
            const updatedStock =
              await tx.inventoryStock.update({
                where: {
                  inventory_id_inventory_sku_id: {
                    inventory_id: this.inventoryId,

                    inventory_sku_id: skuId,
                  },
                },

                data: {
                  inventory_stock_quantity: {
                    increment: quantityChange,
                  },
                },
              });

            quantityAfter =
              updatedStock.inventory_stock_quantity;
          }

          // -------------------------------------
          // 3.10. UPDATE SERIAL NUMBER
          // -------------------------------------

          const updateResult =
            await tx.inventorySkuSerial.updateMany({
              where: {
                inventory_sku_serial_id: serialId,

                inventory_id: this.inventoryId,

                inventory_sku_id: skuId,

                inventory_sku_serial_number:
                  oldSerialNumber,

                inventory_sku_serial_status_id:
                  currentSerial.inventory_sku_serial_status_id,
              },

              data: {
                inventory_sku_serial_number:
                  newSerialNumber,

                inventory_sku_serial_status_id:
                  newStatus.inventory_sku_serial_status_id,
              },
            });

          if (updateResult.count !== 1) {
            throw new ConflictException(
              'Dữ liệu Serial Number đã thay đổi. ' +
              'Vui lòng tải lại và thử lại.',
            );
          }

          const updatedSerial =
            await tx.inventorySkuSerial.findUniqueOrThrow({
              where: {
                inventory_sku_serial_id: serialId,
              },

              include: {
                status: true,
              },
            });

          // -------------------------------------
          // 3.11. CREATE ADJUSTMENT TRANSACTION
          // -------------------------------------

          let transactionId: number | null = null;

          if (quantityChange !== 0) {
            const adjustmentType =
              await tx.inventoryTransactionType.findUnique({
                where: {
                  inventory_transaction_type_code:
                    'ADJUSTMENT',
                },
              });

            if (!adjustmentType) {
              throw new InternalServerErrorException(
                'Không tìm thấy loại giao dịch ADJUSTMENT.',
              );
            }

            const transaction =
              await tx.inventoryTransaction.create({
                data: {
                  inventory_id: this.inventoryId,

                  inventory_transaction_type_id:
                    adjustmentType.inventory_transaction_type_id,

                  inventory_transaction_from:
                    `Serial #${serialId}: ${oldStatusCode}`,

                  inventory_transaction_to:
                    `Serial #${serialId}: ${newStatusCode}`,

                  items: {
                    create: {
                      inventory_sku_id: skuId,

                      inventory_transaction_item_quantity:
                        Math.abs(quantityChange),

                      inventory_transaction_item_before:
                        quantityBefore,

                      inventory_transaction_item_after:
                        quantityAfter,
                    },
                  },
                },
              });

            transactionId =
              transaction.inventory_transaction_id;
          }

          // -------------------------------------
          // 3.12. FORMAT RESPONSE DATA
          // -------------------------------------

          return {
            inventory_id: this.inventoryId,

            inventory_branch_id: this.branchId,

            inventory_sku_id: skuId,

            inventory_sku_code:
              currentSerial.sku.inventory_sku_code,

            old_serial_number: oldSerialNumber,

            new_serial_number: newSerialNumber,

            old_status: oldStatusCode,

            new_status: newStatusCode,

            quantity_change: quantityChange,

            inventory_stock_quantity_before:
              quantityBefore,

            inventory_stock_quantity_after:
              quantityAfter,

            inventory_transaction_id:
              transactionId,

            serial: updatedSerial,
          };
        },

        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,

          timeout: 15000,
        },
      );

      // =========================================
      // 4. RETURN RESPONSE
      // =========================================

      return {
        success: true,

        message:
          `Cập nhật Serial Number ` +
          `"${result.new_serial_number}" thành công.`,

        data: result,
      };

    } catch (error) {

      // =========================================
      // 5. HANDLE HTTP EXCEPTION
      // =========================================

      if (error instanceof HttpException) {
        throw error;
      }

      // =========================================
      // 6. HANDLE PRISMA ERROR
      // =========================================

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Serial Number đã tồn tại trong hệ thống.',
          );
        }

        if (
          error.code === 'P2034' ||
          error.code === 'P2025'
        ) {
          throw new ConflictException(
            'Dữ liệu kho đang được cập nhật bởi thao tác khác. ' +
            'Vui lòng tải lại và thử lại.',
          );
        }
      }

      // =========================================
      // 7. HANDLE DATABASE ERROR
      // =========================================

      console.error(
        `UPDATE ${this.warehouseName} SERIAL ERROR:`,
        error,
      );

      throw new InternalServerErrorException(
        `Không thể cập nhật Serial Number trong ${this.warehouseName}.`,
      );
    }
  }

  // ======================================================
  // 6. (POST) EXPORT WAREHOUSE INVENTORY
  // ======================================================

  async exportInventory(
    accessToken: string,
    type: 'TRANSFER' | 'EXPORT',
    serialIds: number[],
    destinationBranchId?: number,
    destination?: string,
  ) {
    // =========================================
    // 1. CHECK PERMISSION
    // =========================================

    await this.checkPermission(
      accessToken,
      `${this.permissionPrefix}-export:create`,
    );

    // =========================================
    // 2. VALIDATE INPUT
    // =========================================

    if (type !== 'TRANSFER' && type !== 'EXPORT') {
      throw new BadRequestException(
        'Loại xuất kho không hợp lệ.',
      );
    }

    if (
      !Array.isArray(serialIds) ||
      serialIds.length === 0
    ) {
      throw new BadRequestException(
        'Danh sách Serial ID không được để trống.',
      );
    }

    if (serialIds.length > 500) {
      throw new BadRequestException(
        'Chỉ được xuất tối đa 500 Serial mỗi lần.',
      );
    }

    if (
      serialIds.some(
        (id) => !Number.isSafeInteger(id) || id <= 0,
      )
    ) {
      throw new BadRequestException(
        'Danh sách chứa Serial ID không hợp lệ.',
      );
    }

    if (new Set(serialIds).size !== serialIds.length) {
      throw new BadRequestException(
        'Danh sách Serial ID bị trùng lặp.',
      );
    }

    // =========================================
    // 3. VALIDATE DESTINATION
    // =========================================

    if (type === 'TRANSFER') {
      if (
        typeof destinationBranchId !== 'number' ||
        !Number.isSafeInteger(destinationBranchId) ||
        destinationBranchId <= 0
      ) {
        throw new BadRequestException(
          'Vui lòng chọn chi nhánh nhận hàng.',
        );
      }

      if (destinationBranchId === this.branchId) {
        throw new BadRequestException(
          `Không thể điều chuyển hàng về chính ${this.warehouseName}.`,
        );
      }

      if (destination !== undefined) {
        throw new BadRequestException(
          'Không sử dụng destination khi điều chuyển nội bộ.',
        );
      }
    }

    if (type === 'EXPORT') {
      if (
        typeof destination !== 'string' ||
        !destination.trim() ||
        destination.trim().length > 255
      ) {
        throw new BadRequestException(
          'Vui lòng nhập nơi nhận hàng hợp lệ.',
        );
      }

      if (destinationBranchId !== undefined) {
        throw new BadRequestException(
          'Không sử dụng destinationBranchId khi xuất ra bên ngoài.',
        );
      }
    }

    try {
      // =========================================
      // 4. DATABASE TRANSACTION
      // =========================================

      const result = await this.prisma.$transaction(
        async (tx) => {

          // -------------------------------------
          // 4.1. CHECK SOURCE WAREHOUSE
          // -------------------------------------

          const sourceInventory =
            await tx.inventory.findFirst({
              where: {
                inventory_id: this.inventoryId,
                inventory_branch_id: this.branchId,
              },
            });

          if (!sourceInventory) {
            throw new NotFoundException(
              `Không tìm thấy ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 4.2. CHECK DESTINATION WAREHOUSE
          // -------------------------------------

          const destinationInventory =
            type === 'TRANSFER'
              ? await tx.inventory.findUnique({
                  where: {
                    inventory_branch_id:
                      destinationBranchId!,
                  },
                })
              : null;

          if (
            type === 'TRANSFER' &&
            !destinationInventory
          ) {
            throw new NotFoundException(
              'Chi nhánh nhận hàng chưa có kho.',
            );
          }

          if (
            destinationInventory?.inventory_id ===
            sourceInventory.inventory_id
          ) {
            throw new BadRequestException(
              'Kho nguồn và kho đích không được giống nhau.',
            );
          }

          const sourceName = `${this.warehouseName}`;

          const destinationName = destinationInventory
            ? `Kho chi nhánh #${destinationInventory.inventory_branch_id}`
            : destination!.trim();

          // -------------------------------------
          // 4.3. GET AVAILABLE STATUS
          // -------------------------------------

          const availableStatus =
            await tx.inventorySkuSerialStatus.findUnique({
              where: {
                inventory_sku_serial_status_code:
                  'AVAILABLE',
              },
            });

          if (!availableStatus) {
            throw new InternalServerErrorException(
              'Không tìm thấy trạng thái AVAILABLE.',
            );
          }

          // -------------------------------------
          // 4.4. GET EXPORTED STATUS
          // -------------------------------------

          const exportedStatus =
            type === 'EXPORT'
              ? await tx.inventorySkuSerialStatus.findUnique({
                  where: {
                    inventory_sku_serial_status_code:
                      'EXPORTED',
                  },
                })
              : null;

          if (type === 'EXPORT' && !exportedStatus) {
            throw new InternalServerErrorException(
              'Không tìm thấy trạng thái EXPORTED.',
            );
          }

          // -------------------------------------
          // 4.5. GET TRANSACTION TYPES
          // -------------------------------------

          const sourceTransactionType =
            await tx.inventoryTransactionType.findUnique({
              where: {
                inventory_transaction_type_code:
                  type === 'TRANSFER'
                    ? 'TRANSFER_OUT'
                    : 'EXPORT',
              },
            });

          if (!sourceTransactionType) {
            throw new InternalServerErrorException(
              'Không tìm thấy loại giao dịch xuất kho.',
            );
          }

          const destinationTransactionType =
            type === 'TRANSFER'
              ? await tx.inventoryTransactionType.findUnique({
                  where: {
                    inventory_transaction_type_code:
                      'TRANSFER_IN',
                  },
                })
              : null;

          if (
            type === 'TRANSFER' &&
            !destinationTransactionType
          ) {
            throw new InternalServerErrorException(
              'Không tìm thấy loại giao dịch TRANSFER_IN.',
            );
          }

          // -------------------------------------
          // 4.6. GET SELECTED SERIAL NUMBERS
          // -------------------------------------

          const serials =
            await tx.inventorySkuSerial.findMany({
              where: {
                inventory_sku_serial_id: {
                  in: serialIds,
                },

                inventory_id: this.inventoryId,
              },

              include: {
                sku: true,
                status: true,
              },

              orderBy: {
                inventory_sku_serial_id: 'asc',
              },
            });

          // Kiểm tra tất cả Serial đều thuộc kho hiện tại.
          if (serials.length !== serialIds.length) {
            throw new NotFoundException(
              'Một hoặc nhiều Serial Number không tồn tại ' +
              `trong ${this.warehouseName}.`,
            );
          }

          // -------------------------------------
          // 4.7. CHECK SERIAL STATUS
          // -------------------------------------

          const invalidSerials = serials.filter(
            (serial) =>
              serial.inventory_sku_serial_status_id !==
              availableStatus.inventory_sku_serial_status_id,
          );

          if (invalidSerials.length > 0) {
            throw new ConflictException({
              message:
                'Chỉ được xuất Serial Number có trạng thái AVAILABLE.',

              invalid_serials: invalidSerials.map(
                (serial) => ({
                  serial_id:
                    serial.inventory_sku_serial_id,

                  serial_number:
                    serial.inventory_sku_serial_number,

                  status:
                    serial.status.inventory_sku_serial_status_code,
                }),
              ),
            });
          }

          // -------------------------------------
          // 4.8. GROUP SERIAL NUMBERS BY SKU
          // -------------------------------------

          const skuGroups = new Map<
            number,
            {
              skuId: number;
              skuCode: string;
              serialIds: number[];
              serialNumbers: string[];
            }
          >();

          for (const serial of serials) {
            const skuId = serial.inventory_sku_id;

            let group = skuGroups.get(skuId);

            if (!group) {
              group = {
                skuId,

                skuCode:
                  serial.sku.inventory_sku_code,

                serialIds: [],
                serialNumbers: [],
              };

              skuGroups.set(skuId, group);
            }

            group.serialIds.push(
              serial.inventory_sku_serial_id,
            );

            group.serialNumbers.push(
              serial.inventory_sku_serial_number,
            );
          }

          const groups = [...skuGroups.values()].sort(
            (a, b) => a.skuId - b.skuId,
          );

          // -------------------------------------
          // 4.9. PREPARE TRANSACTION ITEMS
          // -------------------------------------

          const sourceItems: {
            inventory_sku_id: number;
            inventory_transaction_item_quantity: number;
            inventory_transaction_item_before: number;
            inventory_transaction_item_after: number;
          }[] = [];

          const destinationItems: {
            inventory_sku_id: number;
            inventory_transaction_item_quantity: number;
            inventory_transaction_item_before: number;
            inventory_transaction_item_after: number;
          }[] = [];

          const exportedItems: {
            inventory_sku_id: number;
            inventory_sku_code: string;
            quantity: number;
            source_quantity_before: number;
            source_quantity_after: number;
            destination_quantity_before: number | null;
            destination_quantity_after: number | null;
            serial_ids: number[];
            serial_numbers: string[];
          }[] = [];

          // -------------------------------------
          // 4.10. PROCESS EACH SKU
          // -------------------------------------

          for (const group of groups) {
            const quantity = group.serialIds.length;

            // ===================================
            // A. CHECK SOURCE STOCK
            // ===================================

            const sourceStock =
              await tx.inventoryStock.findUnique({
                where: {
                  inventory_id_inventory_sku_id: {
                    inventory_id: this.inventoryId,

                    inventory_sku_id: group.skuId,
                  },
                },
              });

            if (!sourceStock) {
              throw new NotFoundException(
                `SKU "${group.skuCode}" không tồn tại trong ${this.warehouseName}.`,
              );
            }

            if (
              sourceStock.inventory_stock_quantity <
              quantity
            ) {
              throw new ConflictException(
                `SKU "${group.skuCode}" không đủ tồn kho. ` +
                `Hiện có ${sourceStock.inventory_stock_quantity}, ` +
                `yêu cầu xuất ${quantity}.`,
              );
            }

            // ===================================
            // B. DECREASE SOURCE STOCK
            // ===================================

            const decreasedStock =
              await tx.inventoryStock.updateMany({
                where: {
                  inventory_id: this.inventoryId,

                  inventory_sku_id: group.skuId,

                  inventory_stock_quantity: {
                    gte: quantity,
                  },
                },

                data: {
                  inventory_stock_quantity: {
                    decrement: quantity,
                  },
                },
              });

            if (decreasedStock.count !== 1) {
              throw new ConflictException(
                `Tồn kho SKU "${group.skuCode}" đã thay đổi ` +
                'hoặc không còn đủ số lượng.',
              );
            }

            const updatedSourceStock =
              await tx.inventoryStock.findUniqueOrThrow({
                where: {
                  inventory_id_inventory_sku_id: {
                    inventory_id: this.inventoryId,

                    inventory_sku_id: group.skuId,
                  },
                },
              });

            const sourceQuantityAfter =
              updatedSourceStock.inventory_stock_quantity;

            const sourceQuantityBefore =
              sourceQuantityAfter + quantity;

            let destinationQuantityBefore:
              number | null = null;

            let destinationQuantityAfter:
              number | null = null;

            // ===================================
            // C. TRANSFER TO ANOTHER WAREHOUSE
            // ===================================

            if (
              type === 'TRANSFER' &&
              destinationInventory
            ) {
              // Nếu SKU chưa có tại kho đích:
              // Tạo InventoryStock với số lượng xuất.
              //
              // Nếu SKU đã có tại kho đích:
              // Tăng số lượng tồn kho.

              const updatedDestinationStock =
                await tx.inventoryStock.upsert({
                  where: {
                    inventory_id_inventory_sku_id: {
                      inventory_id:
                        destinationInventory.inventory_id,

                      inventory_sku_id: group.skuId,
                    },
                  },

                  create: {
                    inventory_id:
                      destinationInventory.inventory_id,

                    inventory_sku_id: group.skuId,

                    inventory_stock_quantity: quantity,
                  },

                  update: {
                    inventory_stock_quantity: {
                      increment: quantity,
                    },
                  },
                });

              destinationQuantityAfter =
                updatedDestinationStock.inventory_stock_quantity;

              destinationQuantityBefore =
                destinationQuantityAfter - quantity;

              // Chuyển Serial sang kho đích.
              // Giữ nguyên Serial Number và trạng thái AVAILABLE.

              const movedSerials =
                await tx.inventorySkuSerial.updateMany({
                  where: {
                    inventory_sku_serial_id: {
                      in: group.serialIds,
                    },

                    inventory_id: this.inventoryId,

                    inventory_sku_id: group.skuId,

                    inventory_sku_serial_status_id:
                      availableStatus.inventory_sku_serial_status_id,
                  },

                  data: {
                    inventory_id:
                      destinationInventory.inventory_id,
                  },
                });

              if (movedSerials.count !== quantity) {
                throw new ConflictException(
                  `Serial của SKU "${group.skuCode}" đã thay đổi. ` +
                  'Không thể hoàn tất điều chuyển.',
                );
              }

              // Lưu Transaction Item của kho đích.

              destinationItems.push({
                inventory_sku_id: group.skuId,

                inventory_transaction_item_quantity:
                  quantity,

                inventory_transaction_item_before:
                  destinationQuantityBefore,

                inventory_transaction_item_after:
                  destinationQuantityAfter,
              });
            }

            // ===================================
            // D. EXPORT TO EXTERNAL DESTINATION
            // ===================================

            if (
              type === 'EXPORT' &&
              exportedStatus
            ) {
              // Giữ lại Serial để phục vụ tra cứu lịch sử.
              // Không xóa Serial khỏi Database.
              // Chuyển trạng thái thành EXPORTED.

              const updatedSerials =
                await tx.inventorySkuSerial.updateMany({
                  where: {
                    inventory_sku_serial_id: {
                      in: group.serialIds,
                    },

                    inventory_id: this.inventoryId,

                    inventory_sku_id: group.skuId,

                    inventory_sku_serial_status_id:
                      availableStatus.inventory_sku_serial_status_id,
                  },

                  data: {
                    inventory_sku_serial_status_id:
                      exportedStatus.inventory_sku_serial_status_id,
                  },
                });

              if (updatedSerials.count !== quantity) {
                throw new ConflictException(
                  `Serial của SKU "${group.skuCode}" đã thay đổi. ` +
                  'Không thể hoàn tất xuất kho.',
                );
              }
            }

            // ===================================
            // E. PREPARE SOURCE TRANSACTION ITEM
            // ===================================

            sourceItems.push({
              inventory_sku_id: group.skuId,

              inventory_transaction_item_quantity:
                quantity,

              inventory_transaction_item_before:
                sourceQuantityBefore,

              inventory_transaction_item_after:
                sourceQuantityAfter,
            });

            // ===================================
            // F. PREPARE RESPONSE ITEM
            // ===================================

            exportedItems.push({
              inventory_sku_id: group.skuId,

              inventory_sku_code: group.skuCode,

              quantity,

              source_quantity_before:
                sourceQuantityBefore,

              source_quantity_after:
                sourceQuantityAfter,

              destination_quantity_before:
                destinationQuantityBefore,

              destination_quantity_after:
                destinationQuantityAfter,

              serial_ids: group.serialIds,

              serial_numbers: group.serialNumbers,
            });
          }

          // -------------------------------------
          // 4.11. CREATE SOURCE TRANSACTION
          // -------------------------------------

          const sourceTransaction =
            await tx.inventoryTransaction.create({
              data: {
                inventory_id: this.inventoryId,

                inventory_transaction_type_id:
                  sourceTransactionType.inventory_transaction_type_id,

                inventory_transaction_from:
                  sourceName,

                inventory_transaction_to:
                  destinationName,

                items: {
                  create: sourceItems,
                },
              },
            });

          // -------------------------------------
          // 4.12. CREATE DESTINATION TRANSACTION
          // -------------------------------------

          let destinationTransactionId:
            number | null = null;

          if (
            type === 'TRANSFER' &&
            destinationInventory &&
            destinationTransactionType
          ) {
            const destinationTransaction =
              await tx.inventoryTransaction.create({
                data: {
                  inventory_id:
                    destinationInventory.inventory_id,

                  inventory_transaction_type_id:
                    destinationTransactionType.inventory_transaction_type_id,

                  inventory_transaction_from:
                    sourceName,

                  inventory_transaction_to:
                    destinationName,

                  items: {
                    create: destinationItems,
                  },
                },
              });

            destinationTransactionId =
              destinationTransaction.inventory_transaction_id;
          }

          // -------------------------------------
          // 4.13. FORMAT RESPONSE
          // -------------------------------------

          return {
            type,

            source: {
              inventory_id: sourceInventory.inventory_id,

              inventory_branch_id:
                sourceInventory.inventory_branch_id,

              name: sourceName,
            },

            destination: {
              inventory_id:
                destinationInventory?.inventory_id ?? null,

              inventory_branch_id:
                destinationInventory?.inventory_branch_id ?? null,

              name: destinationName,
            },

            total_skus: groups.length,

            total_serials: serials.length,

            total_quantity: serials.length,

            source_transaction_id:
              sourceTransaction.inventory_transaction_id,

            destination_transaction_id:
              destinationTransactionId,

            items: exportedItems,
          };
        },

        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5000,

          timeout: 30000,
        },
      );

      // =========================================
      // 5. RETURN RESPONSE
      // =========================================

      return {
        success: true,

        message:
          type === 'TRANSFER'
            ? `Điều chuyển ${result.total_quantity} sản phẩm ` +
              `từ ${this.warehouseName} đến ${result.destination.name} thành công.`

            : `Xuất ${result.total_quantity} sản phẩm ` +
              `từ ${this.warehouseName} đến ${result.destination.name} thành công.`,

        data: result,
      };

    } catch (error) {

      // =========================================
      // 6. HANDLE HTTP EXCEPTION
      // =========================================

      if (error instanceof HttpException) {
        throw error;
      }

      // =========================================
      // 7. HANDLE PRISMA ERROR
      // =========================================

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        if (
          error.code === 'P2034' ||
          error.code === 'P2025' ||
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Dữ liệu kho đang được cập nhật bởi thao tác khác. ' +
            'Vui lòng tải lại và thử lại.',
          );
        }
      }

      // =========================================
      // 8. HANDLE DATABASE ERROR
      // =========================================

      console.error(
        `EXPORT ${this.warehouseName} INVENTORY ERROR:`,
        error,
      );

      throw new InternalServerErrorException(
        `Không thể thực hiện xuất hàng từ ${this.warehouseName}.`,
      );
    }
  }
}
