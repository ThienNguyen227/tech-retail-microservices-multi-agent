
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UpdateOrderStatusService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async markAsPaid(orderId: number) {
    // 1. Kiểm tra Order tồn tại
    const order = await this.prisma.order.findUnique({
      where: {
        order_id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy Order: ${orderId}`,
      );
    }

    // 2. Cập nhật Payment Status -> PAID
    const updatedOrder =
      await this.prisma.order.update({
        where: {
          order_id: orderId,
        },

        data: {
          order_order_payment_status_id: 2,
        },
      });

    return updatedOrder;
  }
}
