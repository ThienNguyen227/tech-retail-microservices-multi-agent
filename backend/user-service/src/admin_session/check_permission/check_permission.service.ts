import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CheckPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async checkPermission(
    userId: string,
    permissionName: string,
  ): Promise<{ allowed: boolean }> {
    try {
      const hasPermission =
        await this.prisma.role_Permissions.findFirst({
          where: {
            role: {
              User_Roles: {
                some: {
                  user_id: BigInt(userId),
                },
              },
            },
            permission: {
              permission_name: permissionName,
            },
          },
          select: {
            role_id: true,
          },
        });

      return {
        allowed: Boolean(hasPermission),
      };
    } catch {
      throw new InternalServerErrorException(
        'Không thể kiểm tra quyền truy cập.',
      );
    }
  }
}