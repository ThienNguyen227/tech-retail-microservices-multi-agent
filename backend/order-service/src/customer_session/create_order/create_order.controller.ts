import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateOrderService } from './create_order.service';
import { CreateOrderDto } from '../../orders/dto/create_order/create_order.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { JwtPayload } from 'jsonwebtoken';

@Controller('api/v1/customer-session/order-service')
export class CreateOrderController {
  constructor(private readonly createOrderService: CreateOrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post('order')
  async createOrder(@Body() dto: CreateOrderDto,  @Req() req: { user: JwtPayload },) {
    console.log('====== [ORDER SERVICE] DỮ LIỆU NHẬN VÀO (DTO) ======');
    console.log(JSON.stringify(dto, null, 2));
    console.log('====================================================');
    const userId = req.user.sub as string;
    return this.createOrderService.createOrder(userId, dto);
  }
}