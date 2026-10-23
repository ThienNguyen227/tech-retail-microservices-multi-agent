import { Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';

import { LogoutAdminService } from './logout_admin.service';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('api/v1/admin-session/user-service')
export class LogoutAdminController {
  constructor(private readonly logoutAdminService: LogoutAdminService) {}

  @Post('/logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const sessionId = request.body?.session_id;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('Thiếu session_id!');
    }

    const cookieName = `admin_refresh_${sessionId}`;
    const refreshToken = request.cookies?.[cookieName];

    try {
      if (refreshToken) {
        await this.logoutAdminService.logout({
          refresh_token: refreshToken,
        });
      }
    } finally {
      response.clearCookie(cookieName, refreshCookieOptions);
    }

    return { message: 'Đăng xuất thành công' };
  }
}