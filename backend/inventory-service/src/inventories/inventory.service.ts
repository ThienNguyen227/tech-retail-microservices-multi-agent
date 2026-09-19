import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. 
  async checkStock(sku: string, branchId: bigint) {
    if (!sku) {
      throw new BadRequestException('SKU là bắt buộc');
    }

    const inventory = await this.prisma.inventory.findUnique({
      where: {
        inventory_branch_id_inventory_sku: {
          inventory_branch_id: branchId,
          inventory_sku: sku,
        },
      },
      select: {
        inventory_sku: true,
        inventory_quantity: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        'Không tìm thấy sản phẩm trong kho',
      );
    }

    return {
      sku: inventory.inventory_sku,
      quantity: inventory.inventory_quantity,
      inStock: inventory.inventory_quantity > 0,
    };
  }

  // 2.
  async reserveStock(data: any) {
    // =========================
    // 1. VALIDATE REQUEST
    // =========================

    const branchId = Number(data.branchId);

    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new BadRequestException(
        'Branch ID không hợp lệ',
      );
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException(
        'Danh sách sản phẩm không được để trống',
      );
    }

    for (const item of data.items) {
      if (!item.sku?.trim()) {
        throw new BadRequestException(
          'Sản phẩm thiếu SKU',
        );
      }

      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        throw new BadRequestException(
          `Số lượng sản phẩm ${item.sku} không hợp lệ`,
        );
      }
    }

    // =========================
    // 2. TRANSACTION
    // =========================

    await this.prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const sku = item.sku.trim();
        const quantity = Number(item.quantity);

        // =========================
        // TÌM INVENTORY
        // =========================

        const inventory = await tx.inventory.findUnique({
          where: {
            inventory_branch_id_inventory_sku: {
              inventory_branch_id: branchId,
              inventory_sku: sku,
            },
          },
        });

        if (!inventory) {
          throw new NotFoundException(
            `Không tìm thấy tồn kho cho SKU ${sku} tại chi nhánh ${branchId}`,
          );
        }

        // =========================
        // KIỂM TRA TỒN KHO
        // =========================

        if (inventory.inventory_quantity < quantity) {
          throw new BadRequestException(
            `Sản phẩm ${sku} không đủ tồn kho. Còn ${inventory.inventory_quantity}, cần ${quantity}`,
          );
        }

        // =========================
        // TRỪ TỒN KHO
        // =========================

        await tx.inventory.update({
          where: {
            inventory_branch_id_inventory_sku: {
              inventory_branch_id: branchId,
              inventory_sku: sku,
            },
          },
          data: {
            inventory_quantity: {
              decrement: quantity,
            },
          },
        });
      }
    });

    // =========================
    // 3. SUCCESS
    // =========================

    return {
      success: true,
      message: 'Đặt giữ tồn kho thành công',
      branchId,
    };
  }
}