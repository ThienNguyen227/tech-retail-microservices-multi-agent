import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './user.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from "./dto/change-password.dto";
import { VerifyForgotPasswordOtpDto } from "./dto/verify-forgot-password-otp.dto";
import { Req } from '@nestjs/common';
import type { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from "./dto/logout.dto";

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

  @Post('customer/login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    const ipAddress =
      request.ip ?? request.socket.remoteAddress ?? undefined;

    const deviceInfo =
      dto.device_info ?? request.get('user-agent') ?? undefined;

    return this.usersService.login(dto, deviceInfo, ipAddress);
  }

  @Post("customer/logout")
  logout(@Body() dto: LogoutDto) {
    return this.usersService.logout(dto);
  }
}
