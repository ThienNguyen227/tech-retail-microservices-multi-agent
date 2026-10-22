import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { GetUserListDto } from '../dto/get-user-list/get-user-list.dto';

@Injectable()
export class GetUserListService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserList(userId: string, filters: GetUserListDto) {
    // Checkpermission
    const hasPermission = await this.prisma.role_Permissions.findFirst({
      where: {
        role: {
          User_Roles: {
            some: {
              user_id: BigInt(userId),
            },
          },
        },
        permission: {
          permission_name: 'user-list:read',
        },
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException('Bạn không có quyền đọc danh sách tài khoản!');
    }

    try {
      const { search, role, status } = filters;

      const users = await this.prisma.users.findMany({
        where: {
          ...(search?.trim()
            ? {
                OR: [
                  {
                    user_name: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                  {
                    user_email: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                  {
                    user_phone: {
                      contains: search.trim(),
                    },
                  },
                ],
              }
            : {}),

          ...(status ? { user_status: status } : {}),

          ...(role
            ? {
                User_Roles: {
                  some: {
                    role: {
                      role_name: role,
                    },
                  },
                },
              }
            : {}),
        },

        select: {
          user_id: true,
          user_name: true,
          user_email: true,
          user_phone: true,
          user_status: true,
          user_created_at: true,
          user_updated_at: true,
          User_Roles: {
            select: {
              role: {
                select: {
                  role_name: true,
                },
              },
            },
          },
        },

        orderBy: {
          user_created_at: 'desc',
        },
      });

      return users.map((user) => ({
        user_id: user.user_id.toString(),
        user_name: user.user_name,
        user_email: user.user_email,
        user_phone: user.user_phone,
        user_status: user.user_status,
        user_created_at: user.user_created_at,
        user_updated_at: user.user_updated_at,
        roles: user.User_Roles.map((item) => item.role.role_name),
      }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Không thể lấy danh sách tài khoản.');
    }
  }
}