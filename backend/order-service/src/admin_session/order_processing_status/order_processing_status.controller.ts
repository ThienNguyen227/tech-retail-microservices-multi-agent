
import {
  Controller,
  Patch,
  Param,
  Body,
  Headers,
  ParseIntPipe,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import {
  IsIn,
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { OrderProcessingStatusService } from './order_processing_status.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

class UpdateOrderProcessingStatus {
  @IsNotEmpty({
    message: 'Trạng thái xử lý đơn hàng không được để trống.',
  })
  @IsString({
    message: 'Trạng thái xử lý đơn hàng phải là chuỗi ký tự.',
  })
  @IsIn(
    [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'READY_FOR_PICKUP',
      'SHIPPING',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
      'FAILED',
    ],
    {
      message: 'Trạng thái xử lý đơn hàng không hợp lệ.',
    },
  )
  processing_status!: string;
}

@Controller('api/v1/admin-session/order-service')
export class OrderProcessingStatusController {
  constructor(
    private readonly orderProcessingStatusService: OrderProcessingStatusService,
  ) {}

  // 1. (PATCH) UPDATE ORDER PROCESSING STATUS
  @UseGuards(JwtAuthGuard)
  @Patch('order/:orderId/processing-status')
  updateOrderProcessingStatus(
    @Headers('authorization') authorization: string,

    @Param('orderId', ParseIntPipe)
    orderId: number,

    @Body()
    body: UpdateOrderProcessingStatus,
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

    return this.orderProcessingStatusService.updateOrderProcessingStatus(
      accessToken,
      orderId,
      body.processing_status,
    );
  }
}
