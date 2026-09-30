import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { GetOrderDto } from '../dto/get_order/get_order.dto';

@Injectable()
export class GetOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrder(dto: GetOrderDto) {
    const { orderId } = dto;

    const order = await this.prisma.order.findUnique({
      where: {
        order_id: Number(orderId),
      },
      select: {
        order_id: true,
        order_code: true,
        order_user_id: true,
        order_total_amount: true,
        order_order_payment_method_id: true,
        order_order_payment_status_id: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy đơn hàng ${orderId}`,
      );
    }

    return {
      order_id: order.order_id,
      order_code: order.order_code,
      order_user_id: order.order_user_id,
      order_total_amount: order.order_total_amount,
      order_order_payment_method_id: order.order_order_payment_method_id,
      order_order_payment_status_id: order.order_order_payment_status_id,
    };
  }
}