import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GetOrderListService {

  constructor(private readonly prisma: PrismaService) {}

  // 1. (GET) ORDER-LIST
  async getOrderList(userId: string) {

    return this.prisma.order.findMany({
      where: {
        order_user_id: Number(userId),
      },
      include: {
        order_item: true,
      },
      orderBy: {
        order_created_at: 'desc',
      },
    });
  }
}