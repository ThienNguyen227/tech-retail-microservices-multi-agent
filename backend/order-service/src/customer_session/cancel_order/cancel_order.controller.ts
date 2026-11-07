import { Controller, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { CancelOrderService } from './cancel_order.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { JwtPayload } from "jsonwebtoken";

@Controller('api/v1/customer-session/order-service')
export class CancelOrderController {
  constructor(
    private readonly cancelOrderService: CancelOrderService,
  ) {}
  
  // 1. (PATCH) CANCEL-ORDER
  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/cancel')
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Req() req: { user: JwtPayload },
  ) {
    const userId = req.user.sub as string;

    return this.cancelOrderService.cancelOrder(
      userId,
      Number(orderId),
    );
  }
}