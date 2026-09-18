import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  private parseBigIntId(value: unknown, fieldName: string): bigint {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        `${fieldName} phải là số nguyên dương dạng chuỗi`,
      );
    }

    return BigInt(value);
  }

  // Helper định dạng dữ liệu trả về và ép kiểu BigInt sang string
  private formatCustomerResponse(customer: any) {
    return {
      customer_id: customer.customer_id.toString(),
      customer_user_id: customer.customer_user_id.toString(),
      customer_code: customer.customer_code,
      customer_full_name: customer.customer_full_name,
      customer_date_of_birth: customer.customer_date_of_birth,
      customer_gender: customer.customer_gender,
      customer_status: customer.customer_status,
      customer_created_at: customer.customer_created_at,
      customer_updated_at: customer.customer_updated_at,
      addresses:
        customer.addresses?.map((addr: any) => ({
          customer_address_id: addr.customer_address_id.toString(),
          customer_address_customer_id:
            addr.customer_address_customer_id.toString(),
          customer_address_line: addr.customer_address_line,
          customer_address_ward: addr.customer_address_ward,
          customer_address_province: addr.customer_address_province,
          customer_address_default: addr.customer_address_default,
          customer_address_created_at: addr.customer_address_created_at,
          customer_address_updated_at: addr.customer_address_updated_at,
        })) || [],
    };
  }

  // 1. Tạo Customer từ Register (User Service)
  async createForUser(customerUserIdInput: unknown) {
    const customerUserId = this.parseBigIntId(
      customerUserIdInput,
      'customer_user_id',
    );

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

  // 2. Lấy thông tin Customer & Địa chỉ theo userId
  async getCustomerByUserId(userIdInput: unknown) {
    const customerUserId = this.parseBigIntId(userIdInput, 'userId');
    const customer = await this.prisma.customer.findUnique({
      where: {
        customer_user_id: customerUserId,
      },
      include: {
        addresses: {
          orderBy: {
            customer_address_default: 'desc', // Đưa địa chỉ mặc định lên đầu
          },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }
    return this.formatCustomerResponse(customer);
  }

  // 3. Cập nhật thông tin Customer
  async updateCustomerByUserId(
    userIdInput: unknown,
    data: {
      customer_full_name?: string | null;
      customer_date_of_birth?: string | null;
      customer_gender?: string | null;
    },
  ) {
    const customerUserId = this.parseBigIntId(userIdInput, 'userId');

    // Kiểm tra Customer tồn tại
    const customer = await this.prisma.customer.findUnique({
      where: {
        customer_user_id: customerUserId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        'Không tìm thấy thông tin khách hàng',
      );
    }

    // =========================
    // Validate ngày sinh
    // =========================

    let dateOfBirth: Date | null | undefined;

    if (
      data.customer_date_of_birth === null ||
      data.customer_date_of_birth === ''
    ) {
      dateOfBirth = null;
    } else if (data.customer_date_of_birth !== undefined) {
      const parsedDate = new Date(data.customer_date_of_birth);

      if (Number.isNaN(parsedDate.getTime())) {
        throw new BadRequestException(
          'Ngày sinh không hợp lệ',
        );
      }

      dateOfBirth = parsedDate;
    }

    // =========================
    // Validate giới tính
    // =========================

    if (
      data.customer_gender !== undefined &&
      data.customer_gender !== null &&
      !['MALE', 'FEMALE', 'OTHER'].includes(
        data.customer_gender,
      )
    ) {
      throw new BadRequestException(
        'Giới tính không hợp lệ',
      );
    }

    // =========================
    // Cập nhật Customer
    // =========================

    const updatedCustomer = await this.prisma.customer.update({
      where: {
        customer_user_id: customerUserId,
      },

      data: {
        ...(data.customer_full_name !== undefined && {
          customer_full_name: data.customer_full_name,
        }),

        ...(dateOfBirth !== undefined && {
          customer_date_of_birth: dateOfBirth,
        }),

        ...(data.customer_gender !== undefined && {
          customer_gender: data.customer_gender,
        }),
      },

      include: {
        addresses: {
          orderBy: {
            customer_address_default: 'desc',
          },
        },
      },
    });

    return this.formatCustomerResponse(updatedCustomer);
  }

  // 4. Xóa địa chỉ Customer
  async deleteCustomerAddress(addressIdInput: unknown) {
    const addressId = this.parseBigIntId(addressIdInput, "addressId");

    const address = await this.prisma.customer_Address.findUnique({
      where: {
        customer_address_id: addressId,
      },
    });

    if (!address) {
      throw new NotFoundException("Không tìm thấy địa chỉ");
    }

    await this.prisma.customer_Address.delete({
      where: {
        customer_address_id: addressId,
      },
    });

    return {
      message: "Xóa địa chỉ thành công",
      customer_address_id: addressId.toString(),
    };
  }

  // 5. Cập nhật địa chỉ
  async updateCustomerAddress(
    addressIdInput: unknown,
    data: {
      customer_address_line?: string;
      customer_address_ward?: string | null;
      customer_address_province?: string | null;
      customer_address_default?: boolean;
    },
  ) {
    const addressId = this.parseBigIntId(addressIdInput, 'addressId');

    const address = await this.prisma.customer_Address.findUnique({
      where: {
        customer_address_id: addressId,
      },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Nếu cập nhật thành địa chỉ mặc định
    if (data.customer_address_default === true) {
      await this.prisma.$transaction([
        this.prisma.customer_Address.updateMany({
          where: {
            customer_address_customer_id:
              address.customer_address_customer_id,
            customer_address_id: {
              not: addressId,
            },
          },
          data: {
            customer_address_default: false,
          },
        }),

        this.prisma.customer_Address.update({
          where: {
            customer_address_id: addressId,
          },
          data: {
            ...(data.customer_address_line !== undefined && {
              customer_address_line: data.customer_address_line,
            }),
            ...(data.customer_address_ward !== undefined && {
              customer_address_ward: data.customer_address_ward,
            }),
            ...(data.customer_address_province !== undefined && {
              customer_address_province: data.customer_address_province,
            }),
            customer_address_default: true,
          },
        }),
      ]);
    } else {
      await this.prisma.customer_Address.update({
        where: {
          customer_address_id: addressId,
        },
        data: {
          ...(data.customer_address_line !== undefined && {
            customer_address_line: data.customer_address_line,
          }),
          ...(data.customer_address_ward !== undefined && {
            customer_address_ward: data.customer_address_ward,
          }),
          ...(data.customer_address_province !== undefined && {
            customer_address_province: data.customer_address_province,
          }),
          ...(data.customer_address_default !== undefined && {
            customer_address_default: data.customer_address_default,
          }),
        },
      });
    }

    return {
      message: 'Cập nhật địa chỉ thành công',
    };
  }

  // 6. Thêm địa chỉ
  async createCustomerAddress(
    customerIdInput: unknown,
    data: CreateCustomerAddressDto,
  ) {
    const customerId = this.parseBigIntId(
      customerIdInput,
      "customerId",
    );

    // Kiểm tra customer có tồn tại không
    const customer = await this.prisma.customer.findUnique({
      where: {
        customer_id: customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        "Không tìm thấy khách hàng",
      );
    }

    // Nếu đặt làm mặc định
    // thì bỏ mặc định của các địa chỉ cũ
    if (data.customer_address_default) {
      await this.prisma.customer_Address.updateMany({
        where: {
          customer_address_customer_id: customerId,
          customer_address_default: true,
        },
        data: {
          customer_address_default: false,
        },
      });
    }

    const address = await this.prisma.customer_Address.create({
      data: {
        customer_address_customer_id: customerId,
        customer_address_line:
          data.customer_address_line.trim(),

        customer_address_ward:
          data.customer_address_ward?.trim() || null,

        customer_address_province:
          data.customer_address_province?.trim() || null,

        customer_address_default:
          data.customer_address_default,
      },
    });

    return {
      customer_address_id:
        address.customer_address_id.toString(),

      customer_address_customer_id:
        address.customer_address_customer_id.toString(),

      customer_address_line:
        address.customer_address_line,

      customer_address_ward:
        address.customer_address_ward,

      customer_address_province:
        address.customer_address_province,

      customer_address_default:
        address.customer_address_default,

      customer_address_created_at:
        address.customer_address_created_at,

      customer_address_updated_at:
        address.customer_address_updated_at,
    };
  }
}