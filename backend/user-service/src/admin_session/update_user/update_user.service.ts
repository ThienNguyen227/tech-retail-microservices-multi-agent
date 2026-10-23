import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from '../dto/update_user/update_user.dto';

@Injectable()
export class UpdateUserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUser(userId: string, dto: UpdateUserDto) {
    try {
      const {targetUserId, user_name, user_email, user_phone, roles} = dto;

      // 1. Kiểm tra ID hợp lệ
      if (!/^\d+$/.test(targetUserId) || !/^\d+$/.test(userId)) {
        throw new BadRequestException('ID tài khoản không hợp lệ!');
      }

      const currentUserId = BigInt(userId);
      const targetId = BigInt(targetUserId);

      // 2. Kiểm tra quyền cập nhật tài khoản
      const hasPermission = await this.prisma.role_Permissions.findFirst({
        where: {
          role: {
            User_Roles: {
              some: { user_id: currentUserId },
            },
          },
          permission: {
            permission_name: 'user:update',
          },
        },
        select: { role_id: true },
      });

      if (!hasPermission) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật tài khoản.',
        );
      }

      // 3. Kiểm tra dữ liệu đầu vào
      const name = user_name.trim();
      const email = user_email.trim();
      const phone = user_phone.trim();
      const uniqueRoles = [...new Set(roles)];

      if (!name || !email || !phone || uniqueRoles.length === 0) {
        throw new BadRequestException(
          'Vui lòng nhập đầy đủ thông tin và chọn ít nhất một vai trò.',
        );
      }

      // 4. Mở transaction để cập nhật
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Kiểm tra tài khoản mục tiêu
        const targetUser = await tx.users.findUnique({
          where: { user_id: targetId },
          select: { user_id: true },
        });

        if (!targetUser) {
          throw new NotFoundException(
            'Tài khoản cần cập nhật không tồn tại.',
          );
        }

        // Kiểm tra email đã được tài khoản khác sử dụng chưa
        const emailExists = await tx.users.findFirst({
          where: {
            user_email: email,
            user_id: { not: targetId },
          },
          select: { user_id: true },
        });

        if (emailExists) {
          throw new ConflictException('Email đã được sử dụng.');
        }

        // Kiểm tra số điện thoại đã được tài khoản khác sử dụng chưa
        const phoneExists = await tx.users.findFirst({
          where: {
            user_phone: phone,
            user_id: { not: targetId },
          },
          select: { user_id: true },
        });

        if (phoneExists) {
          throw new ConflictException('Số điện thoại đã được sử dụng.');
        }

        // Kiểm tra vai trò tồn tại
        const existingRoles = await tx.roles.findMany({
          where: {
            role_name: { in: uniqueRoles },
          },
          select: {
            role_id: true,
            role_name: true,
          },
        });

        if (existingRoles.length !== uniqueRoles.length) {
          throw new BadRequestException(
            'Có vai trò không tồn tại trong hệ thống.',
          );
        }

        // Cập nhật thông tin tài khoản
        const user = await tx.users.update({
          where: { user_id: targetId },
          data: {
            user_name: name,
            user_email: email,
            user_phone: phone,
          },
          select: {
            user_id: true,
            user_name: true,
            user_email: true,
            user_phone: true,
            user_status: true,
            user_updated_at: true,
          },
        });

        // Xóa vai trò cũ
        await tx.user_Roles.deleteMany({
          where: { user_id: targetId },
        });

        // Gán lại vai trò mới
        await tx.user_Roles.createMany({
          data: existingRoles.map((role) => ({
            user_id: targetId,
            role_id: role.role_id,
          })),
        });

        return {
          ...user,
          roles: existingRoles.map((role) => role.role_name),
        };
      });

      return {
        message: 'Cập nhật tài khoản thành công!',
        data: {
          ...updatedUser,
          user_id: updatedUser.user_id.toString(),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email hoặc số điện thoại đã được sử dụng.',
        );
      }

      throw new InternalServerErrorException(
        'Không thể cập nhật tài khoản.',
      );
    }
  }
}