import { Body, Controller, Post } from '@nestjs/common';
import { CreateOrderService } from './create_order.service';
import { CreateOrderDto } from '../dto/create_order/create_order.dto';

@Controller(['api/v1/orders', 'api/v1/order'])
export class CreateOrderController {
  constructor(private readonly createOrderService: CreateOrderService) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    console.log('====== [ORDER SERVICE] DỮ LIỆU NHẬN VÀO (DTO) ======');
    console.log(JSON.stringify(dto, null, 2));
    console.log('====================================================');

    return this.createOrderService.createOrder(dto);
  }
}