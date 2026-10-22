import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';

import { RefreshAccessTokenService } from './refresh_access_token.service';

const REFRESH_COOKIE_NAME = 'admin_refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('api/v1/admin-session/user-service')
export class RefreshAccessTokenController {
  constructor(private readonly refreshAccessTokenService: RefreshAccessTokenService) {}

  @Post('/refresh-access-token')
  async refresh(@Req() request: Request) {
    const sessionId = request.body?.session_id;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('Thiếu session_id!');
    }

    const cookieName = `admin_refresh_${sessionId}`;
    const refreshToken = request.cookies?.[cookieName];

    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token!');
    }

    return this.refreshAccessTokenService.refresh(refreshToken, sessionId);
  }

}