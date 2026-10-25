import {Injectable, UnauthorizedException, BadRequestException, ConflictException, } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAccountInformationDto } from "../dto/account_information/update_account_information.dto";

@Injectable()
export class AccountInformationService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (GET) ACCOUNT-INFORMATION
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

  // 2. (PATCH) ACCOUNT-INFORMATION
  async updateAccountInformation(userId: string, dto: UpdateAccountInformationDto) {
    const id = BigInt(userId);

    if (!dto.user_name && !dto.user_phone) {
      throw new BadRequestException("Vui lòng cung cấp ít nhất một thông tin cần cập nhật!");
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
        throw new ConflictException("Số điện thoại đã được sử dụng!");
      }
    }
    
    // (TESTING)
    // await new Promise(resolve => setTimeout(resolve, 8000));

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
        throw new ConflictException("Số điện thoại đã được sử dụng!");
      }

      throw error;
    }
  }
}