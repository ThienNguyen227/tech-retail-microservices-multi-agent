import { Controller, Get, Query, Req, UseGuards, Headers, UnauthorizedException, Post, Body } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';
import { IsIn, IsOptional, IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';
import { CreateWarrantyRequestService } from './create_warranty_request.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

class WarrantyRequest {
  @IsString({
    message: 'Mô tả tình trạng sản phẩm phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    message: 'Vui lòng nhập mô tả tình trạng sản phẩm.',
  })
  @MaxLength(500, {
    message: 'Mô tả tình trạng sản phẩm không được vượt quá 500 ký tự.',
  })
  warranty_request_description: string;

  @IsInt({
    message: 'ID phiếu bảo hành phải là số nguyên.',
  })
  warranty_id: number;

  @IsInt({
    message: 'ID loại yêu cầu phải là số nguyên.',
  })
  warranty_request_type_id: number;
}


@Controller('api/v1/admin-session/warranty-service')
export class CreateWarrantyRequestController {
  constructor(
    private readonly createWarrantyRequestService: CreateWarrantyRequestService,
  ) {}

  // 1. (POST) WARRANTY-REQUEST
  @UseGuards(JwtAuthGuard)
  @Post('warranty-request')
  createWarrantyRequest(
    @Headers('authorization') authorization: string,
    @Body() body: WarrantyRequest,
  ) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Thiếu access token.');
    }

    return this.createWarrantyRequestService.createWarrantyRequest(
      accessToken,
      body,
    );
  }
}
