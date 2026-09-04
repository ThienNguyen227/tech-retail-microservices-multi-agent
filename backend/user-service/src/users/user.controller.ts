import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './user.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from "./dto/change-password.dto";
import { VerifyForgotPasswordOtpDto } from "./dto/verify-forgot-password-otp.dto";

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

}
