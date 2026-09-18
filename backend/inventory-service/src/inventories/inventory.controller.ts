import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { InventoryService } from './inventory.service';

@Controller('api/v1/inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // 1.
  @Get('check')
  async checkStock(@Query('sku') sku: string, @Query('branch_id') branchId: string) 
  {
    return this.inventoryService.checkStock(sku, BigInt(branchId));
  }
}