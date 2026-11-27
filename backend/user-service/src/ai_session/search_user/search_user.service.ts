import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface SearchUserParams {
  phones?: string | string[];
  emails?: string | string[];
}

@Injectable()
export class SearchUserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================================
  // NORMALIZE SEARCH VALUES
  // ========================================================

  private normalizeValues(
    values: unknown,
    lowercase = false,
  ): string[] {
    if (values === undefined) {
      return [];
    }

    const list = Array.isArray(values)
      ? values
      : [values];

    if (list.some((value) => typeof value !== 'string')) {
      throw new BadRequestException(
        'Tham số tìm kiếm không hợp lệ',
      );
    }

    const normalized = (list as string[])
      .map((value) =>
        lowercase
          ? value.trim().toLowerCase()
          : value.trim(),
      )
      .filter(Boolean);

    // Loại bỏ giá trị trùng lặp
    return [...new Set(normalized)];
  }

  // ========================================================
  // 1. (GET) SEARCH USER
  // ========================================================

  async searchUser(
    userId: string,
    params: SearchUserParams,
  ) {
    // ========================================================
    // 1. VALIDATE AUTHENTICATED USER ID
    // ========================================================

    if (
      typeof userId !== 'string' ||
      !/^[1-9]\d*$/.test(userId)
    ) {
      throw new UnauthorizedException(
        'Không xác định được tài khoản đang đăng nhập',
      );
    }

    const currentUserId = BigInt(userId);

    // ========================================================
    // 2. GET CURRENT USER AND ROLES
    // ========================================================

    const currentUser = await this.prisma.users.findUnique({
      where: {
        user_id: currentUserId,
      },
      select: {
        user_id: true,
        user_status: true,

        User_Roles: {
          select: {
            role_id: true,
          },
        },
      },
    });

    if (!currentUser) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại',
      );
    }

    if (currentUser.user_status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Tài khoản không còn hoạt động',
      );
    }

    // ========================================================
    // 3. CHECK USER ROLES
    // ========================================================

    const roleIds = currentUser.User_Roles.map(
      (userRole) => userRole.role_id,
    );

    const hasRole1 = roleIds.includes(BigInt(1));
    const hasRole2 = roleIds.includes(BigInt(2));

    // Chỉ CUSTOMER và ADMIN được sử dụng API
    if (!hasRole1 && !hasRole2) {
      throw new ForbiddenException(
        'Tài khoản không có quyền truy vấn thông tin người dùng',
      );
    }

    // CUSTOMER chỉ được truy vấn chính mình
    const isSelfOnly = hasRole1;

    // ========================================================
    // 4. NORMALIZE SEARCH PARAMETERS
    // ========================================================

    const normalizedPhones = this.normalizeValues(
      params.phones,
    );

    const normalizedEmails = this.normalizeValues(
      params.emails,
      true,
    );

    // Giới hạn tổng số giá trị tìm kiếm
    if (
      normalizedPhones.length +
      normalizedEmails.length > 100
    ) {
      throw new BadRequestException(
        'Danh sách tìm kiếm không được vượt quá 100 phần tử',
      );
    }

    // ADMIN phải cung cấp ít nhất một phone hoặc email
    if (
      !isSelfOnly &&
      normalizedPhones.length === 0 &&
      normalizedEmails.length === 0
    ) {
      throw new BadRequestException(
        'Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm',
      );
    }

    // ========================================================
    // 5. BUILD SEARCH CONDITIONS
    // ========================================================

    const searchConditions: {
      user_phone?: {
        in: string[];
      };
      user_email?: {
        in: string[];
      };
    }[] = [];

    if (normalizedPhones.length > 0) {
      searchConditions.push({
        user_phone: {
          in: normalizedPhones,
        },
      });
    }

    if (normalizedEmails.length > 0) {
      searchConditions.push({
        user_email: {
          in: normalizedEmails,
        },
      });
    }

    // ========================================================
    // 6. APPLY AUTHORIZATION
    // ========================================================

    const where = {
      // CUSTOMER chỉ được truy vấn tài khoản đang đăng nhập
      ...(isSelfOnly
        ? {
            user_id: currentUserId,
          }
        : {}),

      // Tìm kiếm theo phone hoặc email
      ...(searchConditions.length > 0
        ? {
            OR: searchConditions,
          }
        : {}),
    };

    // ========================================================
    // 7. QUERY USERS
    // ========================================================

    const users = await this.prisma.users.findMany({
      where,
      select: {
        user_id: true,
        user_name: true,
        user_phone: true,
        user_email: true,
        user_type: true,
        user_status: true,
      },
    });

    // ========================================================
    // 8. RETURN RESULT
    // ========================================================

    return {
      total: users.length,

      users: users.map((user) => ({
        ...user,
        user_id: user.user_id.toString(),
      })),
    };
  }
}