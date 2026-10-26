
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface SearchUserParams {
  phone?: string;
  email?: string;
}

@Injectable()
export class SearchUserService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUser(params: SearchUserParams) {
    const { phone, email } = params;

    // 1. Chuẩn hóa dữ liệu đầu vào
    const normalizedPhone = phone?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    // 2. Kiểm tra tham số tìm kiếm
    if (!normalizedPhone && !normalizedEmail) {
      throw new BadRequestException(
        'Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm',
      );
    }

    // 3. Xây dựng điều kiện tìm kiếm
    const where: {
      user_phone?: string;
      user_email?: string;
    } = {};

    if (normalizedPhone) {
      where.user_phone = normalizedPhone;
    }

    if (normalizedEmail) {
      where.user_email = normalizedEmail;
    }

    // 4. Truy vấn tài khoản người dùng
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

    // 5. Trả về kết quả
    return {
      total: users.length,
      users: users.map((user) => ({
        ...user,
        user_id: user.user_id.toString(),
      })),
    };
  }
}
