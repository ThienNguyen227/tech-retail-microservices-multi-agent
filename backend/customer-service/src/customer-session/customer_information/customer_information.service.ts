import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerInformationService {
  constructor(private readonly prisma: PrismaService) {}

  // 2. (GET) CUSTOMER-INFORMATION
  async getCustomerInformation(userId: string) {
    const customerInformation = await this.prisma.customer.findUnique({
      where: {
        customer_user_id: BigInt(userId),
      },
      include: {
        addresses: {
          orderBy: {
            customer_address_default: 'desc',
          },
        },
      },
    });

    if (!customerInformation) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng!');
    }

    return {
      ...customerInformation,
      customer_id: customerInformation.customer_id.toString(),
      customer_user_id: customerInformation.customer_user_id.toString(),
      addresses: customerInformation.addresses.map((address) => ({
        ...address,
        customer_address_id: address.customer_address_id.toString(),
        customer_address_customer_id: address.customer_address_customer_id.toString(),
      })),
    };
  }
}