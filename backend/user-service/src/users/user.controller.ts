import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

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
}
