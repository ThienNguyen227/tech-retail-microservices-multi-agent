import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { GetOrderListService } from './get_order_list.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { JwtPayload } from "jsonwebtoken";

@Controller('api/v1/customer-session/order-service')
export class GetOrderListController {
  constructor(private readonly getOrderListService: GetOrderListService) {}

  // 1. (GET) ORDER-LIST
  @UseGuards(JwtAuthGuard)
  @Get('order-list')
  getOrderList(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.getOrderListService.getOrderList(userId);
  }
}