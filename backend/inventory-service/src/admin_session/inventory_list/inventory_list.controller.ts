import {
  Controller,
  Get,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';

import {
  IsOptional,
  IsString,
  IsInt,
  IsIn,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

import { InventoryListService } from './inventory_list.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

// ======================================================
// DTO: GET INVENTORY LIST
// ======================================================

class GetInventoryList {
  @IsOptional()
  @IsString({
    message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.',
  })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Branch ID phải là số nguyên.',
  })
  @Min(1)
  branchId?: number;
}

// ======================================================
// DTO: GET INVENTORY SERIAL LIST
// ======================================================

class GetInventorySerialList extends GetInventoryList {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  inventoryId?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  @IsIn(
    ['AVAILABLE', 'RESERVED', 'CANCELLED', 'SOLD'],
    {
      message: 'Trạng thái Serial Number không hợp lệ.',
    },
  )
  status?: string;
}

// ======================================================
// DTO: GET INVENTORY TRANSACTION LIST
// ======================================================

class GetInventoryTransactionList extends GetInventoryList {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  inventoryId?: number;

  @IsOptional()
  @IsString()
  @IsIn(
    ['IMPORT', 'EXPORT', 'TRANSFER_IN', 'TRANSFER_OUT'],
    {
      message: 'Loại giao dịch kho không hợp lệ.',
    },
  )
  transactionType?: string;
}

// ======================================================
// CONTROLLER
// ======================================================

@Controller('api/v1/admin-session/inventory-service')
export class InventoryListController {
  constructor(
    private readonly inventoryListService: InventoryListService,
  ) {}

  // ========================================
  // GET ACCESS TOKEN
  // ========================================

  private getAccessToken(authorization: string): string {
    const accessToken = authorization?.replace(
      /^Bearer\s+/i,
      '',
    );

    if (!accessToken) {
      throw new UnauthorizedException(
        'Thiếu access token.',
      );
    }

    return accessToken;
  }

  // ========================================
  // 1. (GET) INVENTORY-LIST
  // ========================================

  @UseGuards(JwtAuthGuard)
  @Get('inventory-list')
  getInventoryList(
    @Headers('authorization') authorization: string,
    @Query() query: GetInventoryList,
  ) {
    const accessToken = this.getAccessToken(authorization);

    return this.inventoryListService.getInventoryList(
      accessToken,
      query.search,
      query.branchId,
    );
  }

  // ========================================
  // 2. (GET) INVENTORY-SERIAL-LIST
  // ========================================

  @UseGuards(JwtAuthGuard)
  @Get('inventory-serial-list')
  getInventorySerialList(
    @Headers('authorization') authorization: string,
    @Query() query: GetInventorySerialList,
  ) {
    const accessToken = this.getAccessToken(authorization);

    return this.inventoryListService.getInventorySerialList(
      accessToken,
      query.search,
      query.branchId,
      query.inventoryId,
      query.sku,
      query.status,
    );
  }

  // ========================================
  // 3. (GET) INVENTORY-TRANSACTION-LIST
  // ========================================

  @UseGuards(JwtAuthGuard)
  @Get('inventory-transaction-list')
  getInventoryTransactionList(
    @Headers('authorization') authorization: string,
    @Query() query: GetInventoryTransactionList,
  ) {
    const accessToken = this.getAccessToken(authorization);

    return this.inventoryListService.getInventoryTransactionList(
      accessToken,
      query.search,
      query.branchId,
      query.inventoryId,
      query.transactionType,
    );
  }
}