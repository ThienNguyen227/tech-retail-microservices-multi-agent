import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserStatusDto } from '../dto/update_user_status/update_user_status.dto';

@Injectable()
export class UpdateUserStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    try {
      const { targetUserId, status } = dto;

      // 1. Kiểm tra ID hợp lệ
      if (!/^\d+$/.test(targetUserId) || !/^\d+$/.test(userId)) {
        throw new BadRequestException('ID tài khoản không hợp lệ.');
      }

      const currentUserId = BigInt(userId);
      const targetId = BigInt(targetUserId);

      // 2. Kiểm tra quyền cập nhật trạng thái
      const hasPermission = await this.prisma.role_Permissions.findFirst({
        where: {
          role: {
            User_Roles: {
              some: { user_id: currentUserId },
            },
          },
          permission: {
            permission_name: 'user-status:update',
          },
        },
        select: { role_id: true },
      });

      if (!hasPermission) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật trạng thái tài khoản.',
        );
      }

      // 3. Kiểm tra tài khoản mục tiêu tồn tại
      const targetUser = await this.prisma.users.findUnique({
        where: { user_id: targetId },
        select: {
          user_id: true,
          user_status: true,
        },
      });

      if (!targetUser) {
        throw new NotFoundException('Tài khoản cần cập nhật không tồn tại!');
      }

      // 4. Không cho phép tự khóa tài khoản đang đăng nhập
      if (currentUserId === targetId && status !== 'ACTIVE') {
        throw new BadRequestException(
          'Bạn không thể tự khóa hoặc vô hiệu hóa tài khoản của mình.',
        );
      }

      // 5. Kiểm tra trạng thái có thay đổi không
      if (targetUser.user_status === status) {
        throw new BadRequestException('Tài khoản đã ở trạng thái được yêu cầu!',
        );
      }

      // 6. Cập nhật trạng thái
      const updatedUser = await this.prisma.users.update({
        where: { user_id: targetId },
        data: { user_status: status },
        select: {
          user_id: true,
          user_name: true,
          user_status: true,
          user_updated_at: true,
        },
      });

      return {
        message: 'Cập nhật trạng thái tài khoản thành công!',
        data: {
          ...updatedUser,
          user_id: updatedUser.user_id.toString(),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể cập nhật trạng thái tài khoản.',
      );
    }
  }
}