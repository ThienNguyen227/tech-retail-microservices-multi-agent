import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerAddressDto } from '../dto/customer_address/create_customer_address.dto';
import { UpdateCustomerAddressDto } from '../dto/customer_address/update_customer_address.dto';

@Injectable()
export class CustomerAddressService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (POST) CUSTOMER-ADDRESS
  async createCustomerAddress(userId: string, payload: CreateCustomerAddressDto) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        customer_user_id: BigInt(userId),
      },
      select: {
        customer_id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng!');
    }

    const address = await this.prisma.$transaction(async (tx) => {
      // Nếu đặt địa chỉ mới làm mặc định, bỏ mặc định của địa chỉ cũ
      if (payload.customer_address_default) {
        await tx.customer_Address.updateMany({
          where: {
            customer_address_customer_id: customer.customer_id,
          },
          data: {
            customer_address_default: false,
          },
        });
      }

      return tx.customer_Address.create({
        data: {
          customer_address_customer_id: customer.customer_id,
          customer_address_line: payload.customer_address_line.trim(),
          customer_address_ward: payload.customer_address_ward.trim(),
          customer_address_province:
            payload.customer_address_province.trim(),
          customer_address_default: payload.customer_address_default,
        },
      });
    });

    return {
      message: 'Thêm địa chỉ thành công!',
      data: {
        ...address,
        customer_address_id: address.customer_address_id.toString(),
        customer_address_customer_id:
          address.customer_address_customer_id.toString(),
      },
    };
  }

  // 2. (PATCH) CUSTOMER-ADDRESS
  async updateCustomerAddress(
    userId: string,
    addressId: string,
    payload: UpdateCustomerAddressDto,
  ) {
    if (!/^\d+$/.test(addressId)) {
      throw new BadRequestException('ID địa chỉ không hợp lệ!');
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        customer_user_id: BigInt(userId),
      },
      select: {
        customer_id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng!');
    }

    const address = await this.prisma.customer_Address.findFirst({
      where: {
        customer_address_id: BigInt(addressId),
        customer_address_customer_id: customer.customer_id,
      },
    });

    if (!address) {
      throw new NotFoundException(
        'Không tìm thấy địa chỉ hoặc bạn không có quyền chỉnh sửa địa chỉ này!',
      );
    }

    const updatedAddress = await this.prisma.$transaction(async (tx) => {
      if (payload.customer_address_default) {
        await tx.customer_Address.updateMany({
          where: {
            customer_address_customer_id: customer.customer_id,
            customer_address_id: {
              not: BigInt(addressId),
            },
          },
          data: {
            customer_address_default: false,
          },
        });
      }

      return tx.customer_Address.update({
        where: {
          customer_address_id: BigInt(addressId),
        },
        data: {
          customer_address_line: payload.customer_address_line.trim(),
          customer_address_ward: payload.customer_address_ward.trim(),
          customer_address_province:
            payload.customer_address_province.trim(),
          customer_address_default: payload.customer_address_default,
        },
      });
    });

    return {
      message: 'Cập nhật địa chỉ thành công!',
      data: {
        ...updatedAddress,
        customer_address_id:
          updatedAddress.customer_address_id.toString(),
        customer_address_customer_id:
          updatedAddress.customer_address_customer_id.toString(),
      },
    };
  }

  // 3. (DELETE) CUSTOMER-ADDRESS
  async deleteCustomerAddress(
    userId: string,
    addressId: string,
  ) {
    if (!/^\d+$/.test(addressId)) {
      throw new BadRequestException('ID địa chỉ không hợp lệ!');
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        customer_user_id: BigInt(userId),
      },
      select: {
        customer_id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng!');
    }

    const address = await this.prisma.customer_Address.findFirst({
      where: {
        customer_address_id: BigInt(addressId),
        customer_address_customer_id: customer.customer_id,
      },
    });

    if (!address) {
      throw new NotFoundException(
        'Không tìm thấy địa chỉ hoặc bạn không có quyền xóa địa chỉ này!',
      );
    }

    await this.prisma.customer_Address.delete({
      where: {
        customer_address_id: BigInt(addressId),
      },
    });

    return {
      message: 'Xóa địa chỉ thành công!',
    };
  }
  
}