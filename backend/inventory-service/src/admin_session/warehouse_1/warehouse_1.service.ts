import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WarehouseService } from '../warehouse_common/warehouse.service';

@Injectable()
export class Warehouse1Service extends WarehouseService {
  constructor(prisma: PrismaService) {
    super(prisma, {
      inventoryId: 1,
      branchId: 1,
      warehouseName: 'Kho 1',
      permissionPrefix: 'ware-house-1',
    });
  }
}
