import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface SearchUserParams {
  phone?: string;
  email?: string;
}

@Injectable()
export class SearchUserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // 1. (GET) SEARCH USER
  async searchUser(
    userId: string,
    params: SearchUserParams,
  ) {
    const { phone, email } = params;

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

    const hasRole2 = roleIds.includes(BigInt(2));
    const hasRole4 = roleIds.includes(BigInt(1));

    // Chỉ Role 2 và Role 4 được sử dụng API
    if (!hasRole2 && !hasRole4) {
      throw new ForbiddenException(
        'Tài khoản không có quyền truy vấn thông tin người dùng',
      );
    }

    // Role 4: Chỉ được truy vấn chính mình
    const isSelfOnly = hasRole4;

    // ========================================================
    // 4. NORMALIZE SEARCH PARAMETERS
    // ========================================================

    const normalizedPhone = phone?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    // Role 2 phải cung cấp phone hoặc email
    if (
      !isSelfOnly &&
      !normalizedPhone &&
      !normalizedEmail
    ) {
      throw new BadRequestException(
        'Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm',
      );
    }

    // ========================================================
    // 5. BUILD SEARCH CONDITIONS
    // ========================================================

    const where: {
      user_id?: bigint;
      user_phone?: string;
      user_email?: string;
    } = {};

    if (normalizedPhone) {
      where.user_phone = normalizedPhone;
    }

    if (normalizedEmail) {
      where.user_email = normalizedEmail;
    }

    // ========================================================
    // 6. APPLY AUTHORIZATION
    // ========================================================

    // Role 4 chỉ được truy vấn tài khoản đang đăng nhập
    if (isSelfOnly) {
      where.user_id = currentUserId;
    }

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