import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WarehouseService } from '../warehouse_common/warehouse.service';

@Injectable()
export class CentralWarehouseService extends WarehouseService {
  constructor(prisma: PrismaService) {
    super(prisma, {
      inventoryId: 10,
      branchId: 10,
      warehouseName: 'Kho tổng',
      permissionPrefix: 'ware-house-10',
    });
  }
}
