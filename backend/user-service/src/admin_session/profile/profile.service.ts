import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';

import type { JwtPayload } from "jsonwebtoken";
import * as bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { LogoutAdminDto } from "../dto/logout/logout_admin.dto";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        user_id: BigInt(userId),
      },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
        user_phone: true,
        user_type: true,
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