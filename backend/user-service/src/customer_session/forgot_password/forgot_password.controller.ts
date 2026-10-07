import { Controller, Res, Req, UnauthorizedException, Param } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { ForgotPasswordService } from './forgot_password.service';

import { SendOtpForgotPasswordDto } from '../dto/forgot_password/send_otp.dto';
import { ReSendOtpForgotPasswordDto } from '../dto/forgot_password/resend_otp.dto';
import { VerifyOtpForgotPasswordDto } from '../dto/forgot_password/verify_otp.dto';
import { ChangePasswordForgotPasswordDto } from '../dto/forgot_password/change_password.dto';

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
    @Post('forgot-password/otp-verifying')
    async verifyOtp(
    @Body() dto: VerifyOtpForgotPasswordDto,
    @Res({ passthrough: true }) res: Response,
    ) {
    const result =
        await this.forgotPasswordService.verifyOtpForgotPassword(dto);

    res.cookie('reset_token', result.resetToken, {
        httpOnly: true,
        secure: false, // local development
        sameSite: 'lax',
        maxAge: 2 * 60 * 1000, // 2 phút
    });

    return {
        message: 'Xác thực OTP thành công!',
        reset_expires_at: result.reset_expires_at,
    };
    }

    // 4. Change Password for forgot password
    @Post('forgot-password/password-change')
    async changePassword(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: ChangePasswordForgotPasswordDto) {
        const resetToken = req.cookies?.reset_token;

        if (!resetToken) {
            throw new UnauthorizedException('Phiên đổi mật khẩu không tồn tại hoặc đã hết hạn!');
        }

        const result = await this.forgotPasswordService.changePassword(resetToken, dto);

        // Đổi mật khẩu thành công → xóa cookie
        res.clearCookie('reset_token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });

        return result;
    }
}