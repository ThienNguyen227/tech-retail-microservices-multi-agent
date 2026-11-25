import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UseGuards,
  UnauthorizedException,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';

import { Warehouse1Service } from './warehouse_1.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

// ======================================================
// 1. DTO: GET WAREHOUSE 1 INVENTORY LIST
// ======================================================

class GetWarehouse1InventoryList {
  @IsOptional()
  @IsString({
    message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.',
  })
  search?: string;
}

// ======================================================
// 2. DTO: CREATE MULTIPLE WAREHOUSE 1 SKUS
// ======================================================

class CreateWarehouse1SkusDto {
  @IsArray({
    message: 'Danh sách SKU phải là một mảng.',
  })
  @ArrayMinSize(1, {
    message: 'Phải cung cấp ít nhất một SKU.',
  })
  @ArrayMaxSize(500, {
    message: 'Chỉ được thêm tối đa 500 SKU mỗi lần.',
  })
  @IsString({
    each: true,
    message: 'Mỗi SKU phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    each: true,
    message: 'Mã SKU không được để trống.',
  })
  @MaxLength(200, {
    each: true,
    message: 'Mỗi mã SKU tối đa 200 ký tự.',
  })
  skus: string[];
}

// ======================================================
// 3. DTO: UPDATE WAREHOUSE 1 SKU
// ======================================================

class UpdateWarehouse1SkuDto {
  @IsString({
    message: 'Mã SKU phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    message: 'Mã SKU không được để trống.',
  })
  @MaxLength(200, {
    message: 'Mã SKU tối đa 200 ký tự.',
  })
  sku: string;
}

// ======================================================
// 4. DTO: CREATE MULTIPLE WAREHOUSE 1 SERIAL NUMBERS
// ======================================================

class CreateWarehouse1SerialsDto {
  @IsArray({
    message: 'Danh sách Serial Number phải là một mảng.',
  })
  @ArrayMinSize(1, {
    message: 'Phải cung cấp ít nhất một Serial Number.',
  })
  @ArrayMaxSize(500, {
    message: 'Chỉ được thêm tối đa 500 Serial Number mỗi lần.',
  })
  @IsString({
    each: true,
    message: 'Serial Number phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    each: true,
    message: 'Serial Number không được để trống.',
  })
  @MaxLength(200, {
    each: true,
    message: 'Serial Number tối đa 200 ký tự.',
  })
  serialNumbers: string[];

  @IsOptional()
  @IsString({
    message: 'Nguồn nhập hàng phải là chuỗi ký tự.',
  })
  @MaxLength(255)
  source?: string;
}

// ======================================================
// CONTROLLER
// ======================================================

@Controller('api/v1/admin-session/inventory-service/warehouse-1')
export class Warehouse1Controller {
  constructor(
    private readonly warehouse1Service: Warehouse1Service,
  ) {}

  // ======================================================
  // 1. (GET) INVENTORY LIST
  // ======================================================

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

  // ======================================================
  // 2. (POST) CREATE MULTIPLE INVENTORY SKUS
  // ======================================================

  @UseGuards(JwtAuthGuard)
  @Post('inventory-skus')
  createInventorySkus(
    @Headers('authorization') authorization: string,
    @Body() dto: CreateWarehouse1SkusDto,
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

    return this.warehouse1Service.createInventorySkus(
      accessToken,
      dto.skus,
    );
  }

  // ======================================================
  // 3. (PATCH) UPDATE INVENTORY SKU
  // ======================================================

  @UseGuards(JwtAuthGuard)
  @Patch('inventory-skus/:skuId')
  updateInventorySku(
    @Headers('authorization') authorization: string,
    @Param('skuId', ParseIntPipe) skuId: number,
    @Body() dto: UpdateWarehouse1SkuDto,
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

    return this.warehouse1Service.updateInventorySku(
      accessToken,
      skuId,
      dto.sku,
    );
  }

  // ======================================================
  // 4. (POST) CREATE MULTIPLE INVENTORY SERIALS
  // ======================================================

  @UseGuards(JwtAuthGuard)
  @Post('inventory-skus/:skuId/serials')
  createInventorySerials(
    @Headers('authorization') authorization: string,
    @Param('skuId', ParseIntPipe) skuId: number,
    @Body() dto: CreateWarehouse1SerialsDto,
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

    return this.warehouse1Service.createInventorySerials(
      accessToken,
      skuId,
      dto.serialNumbers,
      dto.source,
    );
  }
}