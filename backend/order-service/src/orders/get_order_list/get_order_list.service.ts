import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { GetOrderListDto } from '../dto/get_order_list/get_order_list.dto';

@Injectable()
export class GetOrderListService {

  constructor(private readonly prisma: PrismaService) {}

  async getOrderList(dto: GetOrderListDto) {

    return this.prisma.order.findMany({
      where: {
        order_user_id: Number(dto.userId),
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