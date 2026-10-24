import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';

import { LoginDto } from '../dto/login/login.dto';

@Injectable()
export class LoginService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto, deviceInfo?: string, ipAddress?: string): Promise<{
    access_token: string;
    refresh_token: string;
    user_name: string;
    user_id: string;
    session_id: string; 
    token_type: 'Bearer';
    expires_in: number;}> 
  {

    const user = await this.prisma.users.findUnique({
      where: { user_email: dto.user_email },
      select: 
      {
        user_id: true,
        user_name: true,
        user_type: true,
        user_password_hash: true,
        user_status: true,
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
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    if (user.user_status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hoạt động!');
    }

    const isPasswordValid = await bcrypt.compare(dto.user_password, user.user_password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    const isAdmin = user.User_Roles.some(
      (userRole) =>
        ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(userRole.role.role_name),
    );

    if (isAdmin) {
      throw new UnauthorizedException(
        'Tài khoản này không phải là tài khoản Khách Hàng!',
      );
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException('JWT secret chưa được cấu hình!');
    }

    const sessionId = randomUUID();
    const userId = user.user_id.toString();

    const refreshToken = sign(
      {
        sub: userId,
        sid: sessionId,
        type: 'refresh',
      },
      refreshSecret,
      { expiresIn: '7d' },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000,);

    await this.prisma.sessions.create({
      data: {
        session_id: sessionId,
        session_user_id: user.user_id,
        session_refresh_token_hash: refreshTokenHash,
        session_device_info: deviceInfo,
        session_ip_address: ipAddress,
        session_expires_at: refreshTokenExpiresAt,
      },
    });

    const accessToken = sign(
      {
        sub: userId,
        sid: sessionId,
        user_name: user.user_name,
        user_id: userId,
        roles: user.User_Roles.map(
          (userRole) => userRole.role.role_name,
        ),
        user_type: user.user_type,
        type: 'access',
      },
      accessSecret,
      { expiresIn: '15m' },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user_name: user.user_name,
      user_id: userId,
      session_id: sessionId,
      token_type: 'Bearer',
      expires_in: 15 * 60,
    };
  }
}