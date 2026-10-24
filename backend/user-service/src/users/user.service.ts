import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { Prisma } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from "./dto/logout.dto";
import { sign, verify } from 'jsonwebtoken';
import type { JwtPayload } from "jsonwebtoken";
import { randomUUID } from 'crypto';
import { UpdateAccountDto } from "./dto/update-account.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findByEmail(user_email: string) {
    return this.prisma.users.findUnique({
      where: { user_email },
    });
  }

  async findByPhone(user_phone: string) {
    return this.prisma.users.findUnique({
      where: { user_phone },
    });
  }

  // Get My Profile
  async getMyProfile(userId: string) {
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
      throw new UnauthorizedException("Tài khoản không tồn tại");
    }

    return {
      ...user,
      user_id: user.user_id.toString(),
    };
  }
    // Update My Profile
  async updateMyProfile(userId: string, dto: UpdateAccountDto) {
    const id = BigInt(userId);

    if (!dto.user_name && !dto.user_phone) {
      throw new BadRequestException(
        "Vui lòng cung cấp ít nhất một thông tin cần cập nhật",
      );
    }

    if (dto.user_phone) {
      const phoneOwner = await this.prisma.users.findUnique({
        where: {
          user_phone: dto.user_phone,
        },
        select: {
          user_id: true,
        },
      });

      if (phoneOwner && phoneOwner.user_id !== id) {
        throw new ConflictException("Số điện thoại đã được sử dụng");
      }
    }

    try {
      const user = await this.prisma.users.update({
        where: {
          user_id: id,
        },
        data: {
          ...(dto.user_name ? { user_name: dto.user_name } : {}),
          ...(dto.user_phone ? { user_phone: dto.user_phone } : {}),
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

      return {
        ...user,
        user_id: user.user_id.toString(),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Số điện thoại đã được sử dụng");
      }

      throw error;
    }
  }
}
