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
}