import { Controller } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { SendOtpDto } from '../dto/register/send_otp.dto';
import { ReSendOtpDto } from '../dto/register/resend_otp.dto';
import { RegisterService } from './register.service';

@Controller('api/v1/user-service')
export class RegisterController {
    constructor(private readonly RegisterService: RegisterService) {}

    // 1. Send OTP for registration
    @Post('register/otp-sending')
    sendOtp(@Body() sendOtpDto: SendOtpDto) {
        return this.RegisterService.sendOtp(sendOtpDto);
    }

    // 2. Resend OTP for registration
    @Post('register/otp-resending')
    resendOtp(@Body() resendOtpDto: ReSendOtpDto) {
        return this.RegisterService.resendOtp(resendOtpDto);
    }
}