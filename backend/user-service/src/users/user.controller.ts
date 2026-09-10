import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from "./dto/change-password.dto";
import { VerifyForgotPasswordOtpDto } from "./dto/verify-forgot-password-otp.dto";
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

  @Post('customer/register/send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.usersService.sendOtp(dto);
  }

  @Post('customer/register/verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.usersService.verifyOtp(dto);
  }

  @Post('customer/register/resend-otp')
  resendOtp(@Body() dto: SendOtpDto) {
    return this.usersService.sendOtp(dto);
  }

  @Post('customer/forgot-password/send-otp')
  sendForgotPasswordOtp(@Body() dto: SendOtpDto) {
    return this.usersService.sendForgotPasswordOtp(dto);
  }

  @Post('customer/forgot-password/verify-otp')
  verifyForgotPasswordOtp(@Body() dto: VerifyForgotPasswordOtpDto) {
    return this.usersService.verifyForgotPasswordOtp(dto);
  }

  @Post('customer/forgot-password/resend-otp')
  resendForgotPasswordOtp(@Body() dto: SendOtpDto) {
    return this.usersService.sendForgotPasswordOtp(dto);
  }

  @Post("customer/forgot-password/change-password")
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(dto);
  }

  // @Post('customer/login')
  // login(@Body() dto: LoginDto, @Req() request: Request) {
  //   const ipAddress =
  //     request.ip ?? request.socket.remoteAddress ?? undefined;

  //   const deviceInfo =
  //     dto.device_info ?? request.get('user-agent') ?? undefined;

  //   return this.usersService.login(dto, deviceInfo, ipAddress);
  // }
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

  // @Post('customer/refresh')
  // async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response,) {
  //   const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

  //   const result = await this.usersService.refresh(refreshToken);

  //   // Refresh-token rotation: cookie cũ được thay token mới
  //   response.cookie(
  //     REFRESH_COOKIE_NAME,
  //     result.refresh_token,
  //     refreshCookieOptions,
  //   );

  //   return {
  //     access_token: result.access_token,
  //     token_type: 'Bearer',
  //     expires_in: result.expires_in,
  //   };
  // }
  @Post('customer/refresh')
  async refresh(@Req() request: Request) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];

    return this.usersService.refresh(refreshToken);
  }

  // @Post("customer/logout")
  // logout(@Body() dto: LogoutDto) {
  //   return this.usersService.logout(dto);
  // }
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
