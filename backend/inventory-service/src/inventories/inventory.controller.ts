import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';

interface CheckStockPayload {
  branch_id: number;
  items: 
  { 
    sku: string; 
    quantity: number 
  } [];
}

@Controller('api/v1/inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Lắng nghe method "CheckStock" từ "InventoryService" được định nghĩa trong file .proto
  @GrpcMethod('InventoryService', 'CheckStock')
  async checkStock(data: CheckStockPayload) {
    console.log('[gRPC] Nhận request:', data);

    const result = await this.inventoryService.checkStock(
      data.branch_id,
      data.items,
    );

    console.log('[gRPC] INVENTORY TRẢ VỀ:', result);

    return result;
  }
}