import {
  Controller,
  Get,
  Query,
  Headers,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import {
  IsOptional,
  IsString,
} from 'class-validator';

import { Warehouse1Service } from './warehouse_1.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

// ======================================================
// DTO: GET WAREHOUSE 1 INVENTORY LIST
// ======================================================

class GetWarehouse1InventoryList {
  @IsOptional()
  @IsString({
    message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.',
  })
  search?: string;
}

// ======================================================
// CONTROLLER
// ======================================================

@Controller('api/v1/admin-session/inventory-service/warehouse-1')
export class Warehouse1Controller {
  constructor(
    private readonly warehouse1Service: Warehouse1Service,
  ) {}

  // ========================================
  // 1. (GET) INVENTORY LIST
  // ========================================

  @UseGuards(JwtAuthGuard)
  @Get('inventory-list')
  getInventoryList(
    @Headers('authorization') authorization: string,
    @Query() query: GetWarehouse1InventoryList,
  ) {
    const accessToken = authorization?.replace(
      /^Bearer\s+/i,
      '',
    );

    if (!accessToken) {
      throw new UnauthorizedException(
        'Thiếu access token.',
      );
    }

    return this.warehouse1Service.getInventoryList(
      accessToken,
      query.search,
    );
  }
}