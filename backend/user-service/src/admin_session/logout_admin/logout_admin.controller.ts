import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { LogoutAdminService } from './logout_admin.service';

const REFRESH_COOKIE_NAME = 'admin_refresh_token';

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
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

    try {
      if (refreshToken) {
        await this.logoutAdminService.logout({ refresh_token: refreshToken });
      }
    } finally {
      // response.clearCookie(REFRESH_COOKIE_NAME, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'lax',
      //   path: '/',
      // });
      response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    }

    return { message: 'Đăng xuất thành công' };
  }
}