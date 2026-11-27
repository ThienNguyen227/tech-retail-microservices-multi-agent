import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

// ============================================================
// INTERFACES
// ============================================================

interface CustomerSearchParams {
  userIds?: string | string[];
  customerCodes?: string | string[];
}

interface CustomerSearchWhere {
  customer_user_id?: bigint;

  OR?: Array<{
    customer_user_id?: {
      in: bigint[];
    };

    customer_code?: {
      in: string[];
    };
  }>;
}

// ============================================================
// CONSTANTS
// ============================================================

const MAX_SEARCH_VALUES = 100;

const MAX_BIGINT = BigInt(
  '9223372036854775807',
);

@Injectable()
export class SearchCustomerService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================================
  // NORMALIZE SEARCH VALUES
  // ========================================================

  private normalizeValues(
    values: unknown,
  ): string[] {
    if (values === undefined) {
      return [];
    }

    const list = Array.isArray(values)
      ? values
      : [values];

    if (
      list.some(
        (value) =>
          typeof value !== 'string' ||
          !value.trim(),
      )
    ) {
      throw new BadRequestException(
        'Giá trị tìm kiếm phải là chuỗi không rỗng',
      );
    }

    const normalized = (list as string[]).map(
      (value) => value.trim(),
    );

    // Loại bỏ giá trị trùng lặp
    return [...new Set(normalized)];
  }

  // ========================================================
  // PARSE USER ID
  // ========================================================

  private parseUserId(value: string): bigint {
    if (
      !/^[1-9]\d{0,18}$/.test(value) ||
      BigInt(value) > MAX_BIGINT
    ) {
      throw new BadRequestException(
        'User ID phải là số nguyên dương hợp lệ',
      );
    }

    return BigInt(value);
  }

  // ========================================================
  // 1. (GET) SEARCH CUSTOMER AND ADDRESSES
  // ========================================================

  async searchCustomer(
    currentUserId: string | undefined,
    roles: unknown,
    params: CustomerSearchParams,
  ) {
    // ========================================================
    // 1. VALIDATE AUTHENTICATED USER ID
    // ========================================================

    if (
      typeof currentUserId !== 'string' ||
      !/^[1-9]\d{0,18}$/.test(currentUserId) ||
      BigInt(currentUserId) > MAX_BIGINT
    ) {
      throw new UnauthorizedException(
        'Không xác định được tài khoản đăng nhập',
      );
    }

    const authenticatedUserId = BigInt(
      currentUserId,
    );

    // ========================================================
    // 2. VALIDATE ROLES FROM JWT
    // ========================================================

    if (
      !Array.isArray(roles) ||
      roles.some(
        (role) => typeof role !== 'string',
      )
    ) {
      throw new ForbiddenException(
        'Không xác định được quyền của tài khoản',
      );
    }

    // Role 1: CUSTOMER
    const isCustomer = roles.includes('CUSTOMER');

    // Role 2: ADMIN
    const isAdmin = roles.includes('ADMIN');

    // Role 3: MANAGER
    const isManager = roles.includes('MANAGER');

    // Role 4: EMPLOYEE
    const isEmployee = roles.includes('EMPLOYEE');

    const canSearchAll =
      isAdmin ||
      isManager ||
      isEmployee;

    // ========================================================
    // 3. CHECK AUTHORIZATION
    // ========================================================

    if (!isCustomer && !canSearchAll) {
      throw new ForbiddenException(
        'Bạn không có quyền truy vấn thông tin khách hàng',
      );
    }

    // CUSTOMER chỉ được truy vấn chính mình.
    // Nếu có CUSTOMER cùng Role khác,
    // vẫn ưu tiên giới hạn quyền CUSTOMER.
    const isSelfOnly = isCustomer;

    // ========================================================
    // 4. NORMALIZE SEARCH PARAMETERS
    // ========================================================

    const userIds = this.normalizeValues(
      params.userIds,
    );

    const customerCodes = this.normalizeValues(
      params.customerCodes,
    );

    // Giới hạn tổng số định danh tìm kiếm
    if (
      userIds.length + customerCodes.length >
      MAX_SEARCH_VALUES
    ) {
      throw new BadRequestException(
        'Tối đa 100 giá trị tìm kiếm mỗi lần',
      );
    }

    if (
      customerCodes.some(
        (code) => code.length > 256,
      )
    ) {
      throw new BadRequestException(
        'Mã khách hàng quá dài',
      );
    }

    // ADMIN, MANAGER, EMPLOYEE phải cung cấp định danh.
    // Không cho phép truy xuất toàn bộ bảng khi bỏ trống.
    if (
      !isSelfOnly &&
      userIds.length === 0 &&
      customerCodes.length === 0
    ) {
      throw new BadRequestException(
        'Vui lòng cung cấp userIds hoặc customerCodes',
      );
    }

    // ========================================================
    // 5. BUILD SEARCH CONDITIONS
    // ========================================================

    const conditions: NonNullable<
      CustomerSearchWhere['OR']
    > = [];

    if (userIds.length > 0) {
      conditions.push({
        customer_user_id: {
          in: userIds.map(
            (id) => this.parseUserId(id),
          ),
        },
      });
    }

    if (customerCodes.length > 0) {
      conditions.push({
        customer_code: {
          in: customerCodes,
        },
      });
    }

    // ========================================================
    // 6. APPLY AUTHORIZATION
    // ========================================================

    const where: CustomerSearchWhere = {
      // CUSTOMER chỉ truy vấn dữ liệu của chính mình
      ...(isSelfOnly
        ? {
            customer_user_id: authenticatedUserId,
          }
        : {}),

      // Batch Search theo User ID hoặc mã khách hàng
      ...(conditions.length > 0
        ? {
            OR: conditions,
          }
        : {}),
    };

    // ========================================================
    // 7. QUERY CUSTOMERS
    // ========================================================

    const customers =
      await this.prisma.customer.findMany({
        where,

        select: {
          customer_id: true,
          customer_user_id: true,
          customer_code: true,
          customer_full_name: true,
          customer_date_of_birth: true,
          customer_gender: true,
          customer_status: true,
          customer_created_at: true,
          customer_updated_at: true,
        },

        orderBy: {
          customer_id: 'asc',
        },
      });

    // ========================================================
    // 8. HANDLE EMPTY RESULT
    // ========================================================

    if (customers.length === 0) {
      return {
        total: 0,
        totalAddresses: 0,
        data: [],
      };
    }

    // ========================================================
    // 9. GET AUTHORIZED CUSTOMER IDS
    // ========================================================

    const customerIds = customers.map(
      (customer) => customer.customer_id,
    );

    // ========================================================
    // 10. QUERY ALL CUSTOMER ADDRESSES
    // ========================================================

    const addresses =
      await this.prisma.customer_Address.findMany({
        where: {
          customer_address_customer_id: {
            in: customerIds,
          },
        },

        select: {
          customer_address_id: true,
          customer_address_customer_id: true,
          customer_address_line: true,
          customer_address_ward: true,
          customer_address_province: true,
          customer_address_default: true,
          customer_address_created_at: true,
          customer_address_updated_at: true,
        },

        orderBy: [
          {
            customer_address_default: 'desc',
          },
          {
            customer_address_id: 'asc',
          },
        ],
      });

    // ========================================================
    // 11. FORMAT CUSTOMER ADDRESSES
    // ========================================================

    const formattedAddresses = addresses.map(
      (address) => ({
        ...address,

        customer_address_id:
          address.customer_address_id.toString(),

        customer_address_customer_id:
          address.customer_address_customer_id.toString(),
      }),
    );

    // ========================================================
    // 12. GROUP ADDRESSES BY CUSTOMER ID
    // ========================================================

    const addressGroups = new Map<
      string,
      typeof formattedAddresses
    >();

    for (const address of formattedAddresses) {
      const customerId =
        address.customer_address_customer_id;

      const customerAddresses =
        addressGroups.get(customerId) ?? [];

      customerAddresses.push(address);

      addressGroups.set(
        customerId,
        customerAddresses,
      );
    }

    // ========================================================
    // 13. MERGE CUSTOMERS AND ADDRESSES
    // ========================================================

    const data = customers.map((customer) => ({
      ...customer,

      customer_id:
        customer.customer_id.toString(),

      customer_user_id:
        customer.customer_user_id.toString(),

      addresses:
        addressGroups.get(
          customer.customer_id.toString(),
        ) ?? [],
    }));

    // ========================================================
    // 14. RETURN RESULT
    // ========================================================

    return {
      total: customers.length,
      totalAddresses: addresses.length,
      data,
    };
  }
}