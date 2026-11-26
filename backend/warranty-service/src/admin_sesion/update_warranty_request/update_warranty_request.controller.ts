import {
  Controller,
  Patch,
  Param,
  Body,
  Headers,
  UseGuards,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';

import {
  IsInt,
  IsDefined,
  Min,
} from 'class-validator';

import { UpdateWarrantyRequestService } from './update_warranty_request.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

class UpdateWarrantyRequest {
  @IsDefined({
    message: 'Vui lòng cung cấp ID trạng thái yêu cầu bảo hành.',
  })
  @IsInt({
    message: 'ID trạng thái yêu cầu bảo hành phải là số nguyên.',
  })
  @Min(1, {
    message: 'ID trạng thái yêu cầu bảo hành phải lớn hơn 0.',
  })
  warranty_request_status_id: number;
}

@Controller('api/v1/admin-session/warranty-service')
export class UpdateWarrantyRequestController {
  constructor(
    private readonly updateWarrantyRequestService:
      UpdateWarrantyRequestService,
  ) {}

  // 1. (PATCH) UPDATE WARRANTY REQUEST STATUS
  @UseGuards(JwtAuthGuard)
  @Patch('warranty-request/:warrantyRequestId/status')
  updateWarrantyRequest(
    @Headers('authorization') authorization: string,
    @Param('warrantyRequestId', ParseIntPipe)
    warrantyRequestId: number,
    @Body() body: UpdateWarrantyRequest,
  ) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Thiếu access token.');
    }

    return this.updateWarrantyRequestService.updateWarrantyRequest(
      accessToken,
      warrantyRequestId,
      body,
    );
  }
}