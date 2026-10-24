import { Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';

import { LogoutCustomerService } from './logout.service';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('api/v1/customer-session/user-service')
export class LogoutCustomerController {
  constructor(private readonly logoutCustomerService: LogoutCustomerService) {}

  @Post('/logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const sessionId = request.body?.session_id;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('Thiếu session_id!');
    }

    const cookieName = `customer_refresh_${sessionId}`;
    const refreshToken = request.cookies?.[cookieName];

    try {
      if (refreshToken) {
        await this.logoutCustomerService.logout({
          refresh_token: refreshToken,
        });
      }
    } finally {
      response.clearCookie(cookieName, refreshCookieOptions);
    }

    return { message: 'Đăng xuất thành công' };
  }
}