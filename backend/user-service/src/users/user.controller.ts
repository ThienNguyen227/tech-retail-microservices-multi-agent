import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from "./dto/logout.dto";
import type { JwtPayload } from "jsonwebtoken";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateAccountDto } from "./dto/update-account.dto";


const REFRESH_COOKIE_NAME = 'refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth/customer',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Post('customer/login')
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response,) {
    const ipAddress = request.ip ?? request.socket.remoteAddress ?? undefined;

    const deviceInfo = dto.device_info ?? request.get('user-agent') ?? undefined;

    const result = await this.usersService.login(dto, deviceInfo, ipAddress);

    response.cookie(
      REFRESH_COOKIE_NAME,
      result.refresh_token,
      refreshCookieOptions,
    );

    // Không cho refresh token xuất hiện trong JSON response
    const { refresh_token, ...loginResponse } = result;
    return loginResponse;
  }

  @Post('customer/refresh')
  async refresh(@Req() request: Request) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

    return this.usersService.refresh(refreshToken);
  }

  @Post('customer/logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

    try {
      if (refreshToken) {
        await this.usersService.logout({ refresh_token: refreshToken });
      }
    } finally {
      response.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth/customer',
      });
    }

    return { message: 'Đăng xuất thành công' };
  }

  @UseGuards(JwtAuthGuard)
  @Get("customer/me")
  getMyProfile(@Req() request: { user: JwtPayload }) {
    return this.usersService.getMyProfile(request.user.sub as string);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("customer/me")
  updateMyProfile(
    @Req() request: { user: JwtPayload },
    @Body() dto: UpdateAccountDto,
  ) {
    return this.usersService.updateMyProfile(
      request.user.sub as string,
      dto,
    );
  }
}
