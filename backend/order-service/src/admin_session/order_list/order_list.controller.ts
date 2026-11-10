
import {
  Controller,
  Get,
  Patch,
  Query,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import {
  IsIn,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';

import { OrderListService } from './order_list.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

// ======================================================
// DTO: GET ORDER LIST
// ======================================================

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

// ======================================================
// DTO: UPDATE ORDER
// ======================================================

export class UpdateOrderDto {
  // ----------------------------------------
  // RECIPIENT INFORMATION
  // ----------------------------------------

  @ValidateIf((_, value) => value !== undefined)
  @IsString({
    message: 'Tên người nhận phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    message: 'Tên người nhận không được để trống.',
  })
  order_recipient_name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString({
    message: 'Số điện thoại phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    message: 'Số điện thoại không được để trống.',
  })
  order_recipient_phone?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString({
    message: 'Địa chỉ phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    message: 'Địa chỉ không được để trống.',
  })
  order_address_line?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty({
    message: 'Phường không được để trống.',
  })
  order_ward?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty({
    message: 'Tỉnh/thành phố không được để trống.',
  })
  order_province?: string;

  // ----------------------------------------
  // DELIVERY AND PAYMENT METHOD
  // ----------------------------------------

  @ValidateIf((_, value) => value !== undefined)
  @IsInt({
    message: 'Phương thức giao hàng phải là số nguyên.',
  })
  @Min(1)
  order_order_delivery_method_id?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt({
    message: 'Phương thức thanh toán phải là số nguyên.',
  })
  @Min(1)
  order_order_payment_method_id?: number;

  // ----------------------------------------
  // COUPON INFORMATION
  // ----------------------------------------

  @IsOptional()
  @IsInt({
    message: 'Coupon ID phải là số nguyên.',
  })
  @Min(1)
  order_coupon_id?: number | null;

  @IsOptional()
  @IsString({
    message: 'Tên coupon phải là chuỗi ký tự.',
  })
  order_coupon_name?: string | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Số tiền giảm từ coupon không hợp lệ.',
    },
  )
  @Min(0)
  order_coupon_discount_amount?: number | null;

  // ----------------------------------------
  // ORDER AMOUNT
  // ----------------------------------------

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Tổng tiền sản phẩm không hợp lệ.',
    },
  )
  @Min(0)
  order_subtotal?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Phí vận chuyển không hợp lệ.',
    },
  )
  @Min(0)
  order_shipping_fee?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Số tiền giảm giá không hợp lệ.',
    },
  )
  @Min(0)
  order_discount_amount?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Tổng thanh toán không hợp lệ.',
    },
  )
  @Min(0)
  order_total_amount?: number;
}

// ======================================================
// CONTROLLER
// ======================================================

@Controller('api/v1/admin-session/order-service')
export class OrderListController {
  constructor(
    private readonly orderListService: OrderListService,
  ) {}

  // ========================================
  // 1. (GET) ORDER-LIST
  // ========================================

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

  // ========================================
  // 2. (PATCH) UPDATE ORDER
  // ========================================

  @UseGuards(JwtAuthGuard)
  @Patch('order/:orderId')
  updateOrder(
    @Headers('authorization') authorization: string,

    @Param('orderId', ParseIntPipe)
    orderId: number,

    @Body()
    body: UpdateOrderDto,
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

    // Kiểm tra body không được rỗng
    if (Object.keys(body).length === 0) {
      throw new BadRequestException(
        'Vui lòng cung cấp thông tin cần cập nhật.',
      );
    }

    return this.orderListService.updateOrder(
      accessToken,
      orderId,
      body,
    );
  }
}
