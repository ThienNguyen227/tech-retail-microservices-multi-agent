import { Controller } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { ForgotPasswordService } from './forgot_password.service';

import { SendOtpForgotPasswordDto } from '../dto/forgot_password/send_otp.dto';
import { ReSendOtpForgotPasswordDto } from '../dto/forgot_password/resend_otp.dto';

@Controller('api/v1/user-service')
export class ForgotPasswordController {
    constructor(private readonly ForgotPasswordService: ForgotPasswordService) {}

    // 1. Send OTP for forgot password
    @Post('forgot-password/otp-sending')
    sendOtpForgotPassword(@Body() sendOtpForgotPasswordDto: SendOtpForgotPasswordDto) {
        return this.ForgotPasswordService.sendOtpForgotPassword(sendOtpForgotPasswordDto);
    }

    // 2. Resend OTP for forgot password
    @Post('forgot-password/otp-resending')
    reSendOtpForgotPassword(@Body() reSendOtpForgotPasswordDto: ReSendOtpForgotPasswordDto) {
        return this.ForgotPasswordService.reSendOtpForgotPassword(reSendOtpForgotPasswordDto);
    }

    // // 3. Verify OTP for forgot password
    // @Post('forgot-password/otp-verifying')
    // verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    //     return this.ForgotPasswordService.verifyOtp(verifyOtpDto);
    // }
}