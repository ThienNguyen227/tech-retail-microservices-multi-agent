import { Controller, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { ForgotPasswordService } from './forgot_password.service';

import { SendOtpForgotPasswordDto } from '../dto/forgot_password/send_otp.dto';
import { ReSendOtpForgotPasswordDto } from '../dto/forgot_password/resend_otp.dto';
import { VerifyOtpForgotPasswordDto } from '../dto/forgot_password/verify_otp.dto';

@Controller('api/v1/user-service')
export class ForgotPasswordController {
    constructor(private readonly forgotPasswordService: ForgotPasswordService) {}

    // 1. Send OTP for forgot password
    @Post('forgot-password/otp-sending')
    sendOtpForgotPassword(@Body() sendOtpForgotPasswordDto: SendOtpForgotPasswordDto) {
        return this.forgotPasswordService.sendOtpForgotPassword(sendOtpForgotPasswordDto);
    }

    // 2. Resend OTP for forgot password
    @Post('forgot-password/otp-resending')
    reSendOtpForgotPassword(@Body() reSendOtpForgotPasswordDto: ReSendOtpForgotPasswordDto) {
        return this.forgotPasswordService.reSendOtpForgotPassword(reSendOtpForgotPasswordDto);
    }

    // 3. Verify OTP for forgot password
    // @Post('forgot-password/otp-verifying')
    // verifyOtpForgotPassword(@Body() verifyOtpForgotPasswordDto: VerifyOtpForgotPasswordDto) {
    //     return this.ForgotPasswordService.verifyOtpForgotPassword(verifyOtpForgotPasswordDto);
    // }

    @Post('forgot-password/otp-verifying')
    async verifyOtp(@Body() dto: VerifyOtpForgotPasswordDto, @Res({ passthrough: true }) res: Response) {
        const resetToken = await this.forgotPasswordService.verifyOtpForgotPassword(dto);

        res.cookie('reset_token', resetToken, {
            httpOnly: true,
            secure: false, // local development
            sameSite: 'lax',
            maxAge: 2 * 60 * 1000, // 2 phút
        });

        return {
            message: 'Xác thực OTP thành công!',
        };
    }
}