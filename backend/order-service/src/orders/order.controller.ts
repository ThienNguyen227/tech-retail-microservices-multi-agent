import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { OrderService } from './order.service';

@Controller('api/v1/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Tạm khóa
  // @Post()
  // async createOrder(@Body() body: any) {
  //   return this.orderService.createOrder(body);
  // }

  // @Get()
  // getOrders(@Query('userId') userId: string) {
  //   return this.orderService.getOrders(userId);
  // }
}

