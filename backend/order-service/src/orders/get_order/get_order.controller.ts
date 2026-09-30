import { Controller, Get, Query } from '@nestjs/common';
import { GetOrderService } from './get_order.service';
import { GetOrderDto } from '../dto/get_order/get_order.dto';

@Controller('api/v1/order')
export class GetOrderController {
  constructor(private readonly getOrderService: GetOrderService) {}

  @Get('payment')
  getOrder(@Query() dto: GetOrderDto) {
    return this.getOrderService.getOrder(dto);
  }
}



// http://localhost:3007/api/v1/order?orderId=1