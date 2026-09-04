import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(customerUserIdInput: unknown) {
    const customerUserId = this.parseCustomerUserId(customerUserIdInput);

    const customer = await this.prisma.customer.upsert({
      where: {
        customer_user_id: customerUserId,
      },
      update: {},
      create: {
        customer_user_id: customerUserId,
        customer_code: `CUS-${customerUserId.toString()}`,
      },
    });

    return {
      customer_id: customer.customer_id.toString(),
      customer_user_id: customer.customer_user_id.toString(),
      customer_code: customer.customer_code,
    };
  }

  private parseCustomerUserId(value: unknown): bigint {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        'customer_user_id phải là số nguyên dương dạng chuỗi',
      );
    }

    return BigInt(value);
  }
}