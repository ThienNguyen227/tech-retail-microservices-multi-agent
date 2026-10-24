import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';

import { RefreshAccessTokenService } from './refresh_access_token.service';

@Controller('api/v1/customer-session/user-service')
export class RefreshAccessTokenController {
  constructor(private readonly refreshAccessTokenService: RefreshAccessTokenService) {}

  @Post('/refresh-access-token')
  async refresh(@Req() request: Request) {
    const sessionId = request.body?.session_id;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('Thiếu session_id!');
    }

    const cookieName = `customer_refresh_${sessionId}`;
    const refreshToken = request.cookies?.[cookieName];

    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token!');
    }

    return this.refreshAccessTokenService.refresh(refreshToken, sessionId);
  }

}