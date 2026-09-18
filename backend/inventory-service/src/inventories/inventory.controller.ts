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

  
}