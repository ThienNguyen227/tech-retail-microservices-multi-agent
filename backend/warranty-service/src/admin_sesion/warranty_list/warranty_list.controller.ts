import { Controller, Get, Query, Req, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { WarrantyListService } from './warranty_list.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

class GetWarrantyList {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.' })
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'EXPIRED'], {
    message: 'Trạng thái chỉ được phép là ACTIVE, EXPIRED.',
  })
  status?: string;
}


@Controller('api/v1/admin-session/warranty-service')
export class WarrantyListController {
  constructor(
    private readonly warrantyListService: WarrantyListService,
  ) {}

  // 1. (GET) WARRANTY-LIST
  @UseGuards(JwtAuthGuard)
  @Get('warranty-list')
  getWarrantyList(
    @Headers('authorization') authorization: string,
    @Query() query: GetWarrantyList,
  ) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Thiếu access token.');
    }

    return this.warrantyListService.getWarrantyList(
      accessToken,
      query.search,
      query.status,
    );
  }
}
