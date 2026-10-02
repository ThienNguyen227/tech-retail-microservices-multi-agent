import { Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { CancelOrderService } from './cancel_order.service';

@Controller('api/v1/order')
export class CancelOrderController {
  constructor(
    private readonly cancelOrderService: CancelOrderService,
  ) {}

  @Patch(':orderId/cancel')
  async cancelOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.cancelOrderService.cancelOrder(orderId);
  }
}