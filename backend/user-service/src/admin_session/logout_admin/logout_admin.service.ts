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
export class LogoutAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async logout(dto: LogoutAdminDto): Promise<{ message: string }> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!refreshSecret) {
      throw new InternalServerErrorException("JWT refresh secret chưa được cấu hình!");
    }

    let payload: JwtPayload | string;

    try {
      payload = verify(dto.refresh_token, refreshSecret);
    } catch {
      throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn!");
    }

    if (
      typeof payload === "string" ||
      payload.type !== "refresh" ||
      typeof payload.sid !== "string" ||
      typeof payload.sub !== "string"
    ) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    const session = await this.prisma.sessions.findUnique({
      where: {
        session_id: payload.sid,
      },
    });

    if (!session) {
      throw new UnauthorizedException("Session không tồn tại!");
    }

    if (session.session_user_id.toString() !== payload.sub) {
      throw new UnauthorizedException("Refresh token không hợp lệ!");
    }

    if (session.session_revoked_at) {
      return { message: "Tài khoản đã đăng xuất trước đó!" };
    }

    if (session.session_expires_at < new Date()) {
      throw new UnauthorizedException("Session đã hết hạn!");
    }

    const isRefreshTokenValid = await bcrypt.compare(dto.refresh_token, session.session_refresh_token_hash);

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("Refresh token không hợp lệ!");
    }

    await this.prisma.sessions.update({
      where: {
        session_id: session.session_id,
      },
      data: {
        session_revoked_at: new Date(),
      },
    });

    return {
      message: "Đăng xuất thành công",
    };
  }
}