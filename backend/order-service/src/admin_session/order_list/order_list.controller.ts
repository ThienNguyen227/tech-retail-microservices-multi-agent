import {
  Controller,
  Get,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

import { OrderListService } from './order_list.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

class GetOrderList {
  @IsOptional()
  @IsString({
    message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.',
  })
  search?: string;

  @IsOptional()
  @IsString()
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
  processingStatus?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'], {
    message: 'Trạng thái thanh toán không hợp lệ.',
  })
  paymentStatus?: string;
}

@Controller('api/v1/admin-session/order-service')
export class OrderListController {
  constructor(
    private readonly orderListService: OrderListService,
  ) {}

  // 1. (GET) ORDER-LIST
  @UseGuards(JwtAuthGuard)
  @Get('order-list')
  getOrderList(
    @Headers('authorization') authorization: string,
    @Query() query: GetOrderList,
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

    return this.orderListService.getOrderList(
      accessToken,
      query.search,
      query.processingStatus,
      query.paymentStatus,
    );
  }
}
