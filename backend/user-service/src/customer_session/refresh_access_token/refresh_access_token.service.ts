import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtPayload } from "jsonwebtoken";
import * as bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshAccessTokenService {
  constructor(private readonly prisma: PrismaService) {}
 
  async refresh(refreshToken: string, sessionId: string): Promise<{
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
  }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token!');
    }

    if (!sessionId) {
      throw new UnauthorizedException('Không tìm thấy session_id!');
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException(
        'JWT secret chưa được cấu hình!',
      );
    }

    let payload: JwtPayload | string;

    try {
      payload = verify(refreshToken, refreshSecret);
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn!',
      );
    }

    if (
      typeof payload === 'string' ||
      payload.type !== 'refresh' ||
      typeof payload.sid !== 'string' ||
      typeof payload.sub !== 'string'
    ) {
      throw new UnauthorizedException('Refresh token không hợp lệ!');
    }

    // Đảm bảo token thuộc đúng phiên mà frontend yêu cầu refresh.
    if (payload.sid !== sessionId) {
      throw new UnauthorizedException(
        'Refresh token không thuộc phiên đăng nhập này!',
      );
    }

    const session = await this.prisma.sessions.findUnique({
      where: { session_id: payload.sid },
      include: {
        user: {
          include: {
            User_Roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (
      !session ||
      session.session_revoked_at ||
      session.session_expires_at < new Date() ||
      session.session_user_id.toString() !== payload.sub
    ) {
      throw new UnauthorizedException(
        'Session không hợp lệ hoặc đã hết hạn!',
      );
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      session.session_refresh_token_hash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token không hợp lệ!');
    }

    const user = session.user;

    if (!user || user.user_status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hoạt động!');
    }

    const accessToken = sign(
      {
        sub: user.user_id.toString(),
        sid: session.session_id,
        user_name: user.user_name,
        user_id: user.user_id.toString(),
        roles: user.User_Roles.map(
          (userRole) => userRole.role.role_name,
        ),
        type: 'access',
      },
      accessSecret,
      { expiresIn: '15m' },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
    };
  }
  
}