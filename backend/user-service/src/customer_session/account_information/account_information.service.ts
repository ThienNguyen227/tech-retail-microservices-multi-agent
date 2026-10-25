import {Injectable, UnauthorizedException} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountInformationService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountInformation(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        user_id: BigInt(userId),
      },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
        user_phone: true,
        user_status: true,
        user_created_at: true,
        user_updated_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Tài khoản không tồn tại!");
    }

    return {
      ...user,
      user_id: user.user_id.toString(),
    };
  }
}