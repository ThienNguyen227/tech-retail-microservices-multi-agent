import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { LoginService } from './login.service';


import { LoginDto } from '../dto/login/login.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('api/v1/user-service')
export class LoginController {
    constructor(private readonly loginService: LoginService) {}

    @Post('/login')
    async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) 
    {
        const ipAddress = request.ip ?? request.socket.remoteAddress ?? undefined;

        const deviceInfo = dto.device_info ?? request.get('user-agent') ?? undefined;

        const result = await this.loginService.login(dto, deviceInfo, ipAddress);

        response.cookie(REFRESH_COOKIE_NAME, result.refresh_token, refreshCookieOptions);

        const { refresh_token, ...loginResponse } = result;
        return loginResponse;
    }
}