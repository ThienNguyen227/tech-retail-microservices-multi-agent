import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { WarrantyListService } from './warranty_list.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

class GetWarranty {
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
export class GetWarrantyController {
  constructor(private readonly warrantyListService: WarrantyListService) {}

  @UseGuards(JwtAuthGuard)
  @Get('warranty-list')
  getWarrantyList(
    @Req() req: { user: JwtPayload },
    @Query() query: GetWarranty,
  ) {
    const userId = req.user.sub as string;

    return this.warrantyListService.getWarrantyList(userId, query.search, query.status);
  }
}