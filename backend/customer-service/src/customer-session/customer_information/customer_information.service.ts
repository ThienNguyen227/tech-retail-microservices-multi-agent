import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCustomerInformationDto } from '../dto/customer_information/update_customer_information.dto';

@Injectable()
export class CustomerInformationService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (GET) CUSTOMER-INFORMATION
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

  // 2. (PATCH) CUSTOMER-INFORMATION
  async updateCustomerInformation(userId: string, payload: UpdateCustomerInformationDto) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        customer_user_id: BigInt(userId),
      },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng!');
    }

    const data: {
      customer_full_name?: string | null;
      customer_date_of_birth?: Date | null;
      customer_gender?: string | null;
    } = {};

    // 1. Kiểm tra họ tên
    if (payload.customer_full_name !== undefined) {
      const fullName = payload.customer_full_name?.trim() ?? null;

      if (fullName !== null && fullName.length === 0) {
        throw new BadRequestException('Họ tên không được để trống!');
      }

      if (fullName !== null && fullName.length > 100) {
        throw new BadRequestException(
          'Họ tên không được vượt quá 100 ký tự!',
        );
      }

      data.customer_full_name = fullName;
    }

    // 2. Kiểm tra ngày sinh
    if (payload.customer_date_of_birth !== undefined) {
      const dateOfBirth = payload.customer_date_of_birth;

      if (dateOfBirth === null || dateOfBirth === '') {
        data.customer_date_of_birth = null;
      } else {
        const date = new Date(`${dateOfBirth}T00:00:00.000Z`);

        if (
          Number.isNaN(date.getTime()) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
          date.toISOString().slice(0, 10) !== dateOfBirth
        ) {
          throw new BadRequestException(
            'Ngày sinh không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD!',
          );
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (date > today) {
          throw new BadRequestException(
            'Ngày sinh không được lớn hơn ngày hiện tại!',
          );
        }

        data.customer_date_of_birth = date;
      }
    }

    // 3. Kiểm tra giới tính
    if (payload.customer_gender !== undefined) {
      const gender = payload.customer_gender?.trim().toUpperCase() ?? null;

      if (
        gender !== null &&
        !['MALE', 'FEMALE', 'OTHER'].includes(gender)
      ) {
        throw new BadRequestException('Giới tính không hợp lệ!');
      }

      data.customer_gender = gender;
    }

    // 4. Không có dữ liệu cần cập nhật
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Vui lòng cung cấp ít nhất một thông tin cần cập nhật!',
      );
    }

    // 5. Cập nhật thông tin khách hàng
    const updatedCustomer = await this.prisma.customer.update({
      where: {
        customer_user_id: BigInt(userId),
      },
      data,
    });

    // 6. Trả kết quả, chuyển BigInt thành string để tránh lỗi serialize JSON
    return {
      message: 'Cập nhật thông tin khách hàng thành công!',
      data: {
        ...updatedCustomer,
        customer_id: updatedCustomer.customer_id.toString(),
        customer_user_id: updatedCustomer.customer_user_id.toString(),
      },
    };
  }
}