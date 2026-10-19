import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { LoginAdminService } from './login_admin.service';


import { LoginAdminDto } from '../dto/login/loginAdmin.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('api/v1/admin-session/user-service')
export class LoginAdminController {
    constructor(private readonly loginAdminService: LoginAdminService) {}

    @Post('/login')
    async login(@Body() dto: LoginAdminDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) 
    {
        const ipAddress = request.ip ?? request.socket.remoteAddress ?? undefined;

        const deviceInfo = dto.device_info ?? request.get('user-agent') ?? undefined;

        const result = await this.loginAdminService.login(dto, deviceInfo, ipAddress);

        response.cookie(REFRESH_COOKIE_NAME, result.refresh_token, refreshCookieOptions);

        const { refresh_token, ...loginResponse } = result;
        return loginResponse;
    }
}