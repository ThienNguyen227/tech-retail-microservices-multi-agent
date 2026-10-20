import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { RefreshAccessTokenService } from './refresh_access_token.service';

const REFRESH_COOKIE_NAME = 'refresh_token';

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
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];
    return this.refreshAccessTokenService.refresh(refreshToken);
  }

}