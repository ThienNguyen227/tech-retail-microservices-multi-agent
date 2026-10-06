import { Controller } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { RegisterService } from './register.service';

import { SendOtpDto } from '../dto/register/send_otp.dto';
import { ReSendOtpDto } from '../dto/register/resend_otp.dto';
import { VerifyOtpDto } from '../dto/register/verify_otp.dto';

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

    // 3. Verify OTP for registration
    @Post('register/otp-verifying')
    verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.RegisterService.verifyOtp(verifyOtpDto);
    }
}