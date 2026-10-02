import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CheckStockItem {
  sku: string;
  quantity: number;
}

export interface ReservedSerial {
  sku: string;
  serial_numbers: string[];
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra và TRỪ TỒN KHO + RESERVE SERIAL trong cùng Transaction.
   *
   * Chống Race Condition:
   * - UPDATE stock với điều kiện gte
   * - PostgreSQL tự xử lý row-level lock khi UPDATE
   * - Nếu không đủ stock -> count = 0
   * - Nếu lỗi -> toàn bộ transaction ROLLBACK
   */
  async checkStock(branchId: number, items: CheckStockItem[]) {
    const targetBranchId = branchId > 0 ? branchId : 1;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // ==========================================
        // 1. TÌM INVENTORY THEO CHI NHÁNH
        // ==========================================
        const inventory = await tx.inventory.findUnique({
          where: {
            inventory_branch_id: targetBranchId,
          },
        });

        if (!inventory) {
          return {
            is_valid: false,
            message: `Không tìm thấy kho hàng của chi nhánh ${targetBranchId}`,
            reserved_serials: [],
          };
        }

        // ==========================================
        // 2. LẤY STATUS AVAILABLE / RESERVED
        // ==========================================
        const availableStatus =
          await tx.inventorySkuSerialStatus.findUnique({
            where: {
              inventory_sku_serial_status_code: 'AVAILABLE',
            },
          });

        const reservedStatus =
          await tx.inventorySkuSerialStatus.findUnique({
            where: {
              inventory_sku_serial_status_code: 'RESERVED',
            },
          });

        if (!availableStatus || !reservedStatus) {
          throw new Error(
            'Không tìm thấy trạng thái AVAILABLE hoặc RESERVED',
          );
        }

        // Lưu các serial đã reserve để trả về Order-Service
        const reservedSerials: ReservedSerial[] = [];

        // ==========================================
        // 3. XỬ LÝ TỪNG SKU
        // ==========================================
        for (const item of items) {
          // ------------------------------------------
          // 3.1. Tìm SKU
          // ------------------------------------------
          const skuRecord = await tx.inventorySku.findUnique({
            where: {
              inventory_sku_code: item.sku,
            },
          });

          if (!skuRecord) {
            throw new Error(
              `Sản phẩm với mã SKU ${item.sku} không tồn tại trong hệ thống kho`,
            );
          }

          // ------------------------------------------
          // TEST RACE CONDITION
          // ------------------------------------------
          console.log(
            `[${item.sku}] Đã check SKU, chuẩn bị delay...`,
          );

          await new Promise((resolve) => setTimeout(resolve, 3000));

          console.log(
            `[${item.sku}] Hết delay, bắt đầu UPDATE`,
          );

          // ==========================================
          // 3.2. TRỪ INVENTORY STOCK ATOMIC
          // ==========================================
          const updateResult = await tx.inventoryStock.updateMany({
            where: {
              inventory_id: inventory.inventory_id,
              inventory_sku_id: skuRecord.inventory_sku_id,

              // Chỉ update nếu stock còn đủ
              inventory_stock_quantity: {
                gte: item.quantity,
              },
            },

            data: {
              // Trừ stock
              inventory_stock_quantity: {
                decrement: item.quantity,
              },
            },
          });

          // ==========================================
          // 3.3. KHÔNG ĐỦ STOCK
          // ==========================================
          if (updateResult.count === 0) {
            const currentStock = await tx.inventoryStock.findUnique({
              where: {
                inventory_id_inventory_sku_id: {
                  inventory_id: inventory.inventory_id,
                  inventory_sku_id: skuRecord.inventory_sku_id,
                },
              },
            });

            const availableQty =
              currentStock?.inventory_stock_quantity ?? 0;

            throw new Error(
              `Sản phẩm ${item.sku} không đủ số lượng ` +
                `(còn ${availableQty}, yêu cầu ${item.quantity})`,
            );
          }

          // ==========================================
          // 3.4. TÌM SERIAL AVAILABLE
          // ==========================================
          const serials = await tx.inventorySkuSerial.findMany({
            where: {
              inventory_id: inventory.inventory_id,
              inventory_sku_id: skuRecord.inventory_sku_id,

              inventory_sku_serial_status_id:
                availableStatus.inventory_sku_serial_status_id,
            },

            take: item.quantity,
          });

          // ==========================================
          // 3.5. KHÔNG ĐỦ SERIAL
          // ==========================================
          if (serials.length < item.quantity) {
            throw new Error(
              `SKU ${item.sku} không đủ serial khả dụng ` +
                `(còn ${serials.length}, yêu cầu ${item.quantity})`,
            );
          }

          // ==========================================
          // 3.6. AVAILABLE → RESERVED
          // ==========================================
          await tx.inventorySkuSerial.updateMany({
            where: {
              inventory_sku_serial_id: {
                in: serials.map(
                  (serial) =>
                    serial.inventory_sku_serial_id,
                ),
              },

              // Đảm bảo serial vẫn đang AVAILABLE
              inventory_sku_serial_status_id:
                availableStatus.inventory_sku_serial_status_id,
            },

            data: {
              inventory_sku_serial_status_id:
                reservedStatus.inventory_sku_serial_status_id,
            },
          });

          // ==========================================
          // 3.7. LƯU SERIAL ĐỂ TRẢ VỀ ORDER
          // ==========================================
          reservedSerials.push({
            sku: item.sku,
            serial_numbers: serials.map(
              (serial) =>
                serial.inventory_sku_serial_number,
            ),
          });

          console.log(
            `[${item.sku}] Đã RESERVED serial:`,
            serials.map(
              (serial) =>
                serial.inventory_sku_serial_number,
            ),
          );
        }

        // ==========================================
        // 4. TRANSACTION THÀNH CÔNG
        // ==========================================
        return {
          is_valid: true,
          message: 'Đã kiểm tra và giữ tồn kho thành công',
          reserved_serials: reservedSerials,
        };
      });
    } catch (error: any) {
      // ==========================================
      // 5. CÓ LỖI → ROLLBACK TOÀN BỘ TRANSACTION
      // ==========================================
      console.error(
        '[INVENTORY] Transaction rollback:',
        error.message,
      );

      return {
        is_valid: false,
        message:
          error.message || 'Không thể xử lý tồn kho',
        reserved_serials: [],
      };
    }
  }
}