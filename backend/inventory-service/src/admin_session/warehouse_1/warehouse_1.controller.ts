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
  IsIn,
  IsInt,
  Min,
  ArrayUnique,
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
// 5. DTO: UPDATE WAREHOUSE 1 SERIAL NUMBER
// ======================================================

class UpdateWarehouse1SerialDto {
  @IsOptional()
  @IsString({
    message: 'Serial Number phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    message: 'Serial Number không được để trống.',
  })
  @MaxLength(200, {
    message: 'Serial Number tối đa 200 ký tự.',
  })
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['AVAILABLE', 'CANCELLED'], {
    message:
      'Chỉ cho phép cập nhật trạng thái AVAILABLE hoặc CANCELLED.',
  })
  status?: 'AVAILABLE' | 'CANCELLED';
}

// ======================================================
// 6. DTO: EXPORT WAREHOUSE 1 INVENTORY
// ======================================================

class ExportWarehouse1InventoryDto {
  @IsIn(['TRANSFER', 'EXPORT'], {
    message: 'Loại xuất kho không hợp lệ.',
  })
  type: 'TRANSFER' | 'EXPORT';

  @IsOptional()
  @IsInt({
    message: 'Branch ID phải là số nguyên.',
  })
  @Min(1)
  destinationBranchId?: number;

  @IsOptional()
  @IsString({
    message: 'Nơi nhận hàng phải là chuỗi ký tự.',
  })
  @MaxLength(255)
  destination?: string;

  @IsArray({
    message: 'Danh sách Serial ID phải là một mảng.',
  })
  @ArrayMinSize(1, {
    message: 'Phải chọn ít nhất một Serial Number.',
  })
  @ArrayMaxSize(500, {
    message: 'Chỉ được xuất tối đa 500 Serial mỗi lần.',
  })
  @ArrayUnique({
    message: 'Danh sách Serial ID không được trùng lặp.',
  })
  @IsInt({
    each: true,
    message: 'Serial ID phải là số nguyên.',
  })
  @Min(1, {
    each: true,
  })
  serialIds: number[];
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

  // ======================================================
  // 5. (PATCH) UPDATE INVENTORY SERIAL NUMBER
  // ======================================================

  @UseGuards(JwtAuthGuard)
  @Patch('inventory-serials/:serialId')
  updateInventorySerial(
    @Headers('authorization') authorization: string,
    @Param('serialId', ParseIntPipe) serialId: number,
    @Body() dto: UpdateWarehouse1SerialDto,
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

    return this.warehouse1Service.updateInventorySerial(
      accessToken,
      serialId,
      dto.serialNumber,
      dto.status,
    );
  }

  // ======================================================
  // 6. (POST) EXPORT WAREHOUSE 1 INVENTORY
  // ======================================================

  @UseGuards(JwtAuthGuard)
  @Post('export')
  exportInventory(
    @Headers('authorization') authorization: string,
    @Body() dto: ExportWarehouse1InventoryDto,
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

    return this.warehouse1Service.exportInventory(
      accessToken,
      dto.type,
      dto.serialIds,
      dto.destinationBranchId,
      dto.destination,
    );
  }
}