import { Controller, Res, Req, UnauthorizedException, Param } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { ForgotPasswordService } from './forgot_password.service';

import { SendOtpForgotPasswordDto } from '../dto/forgot_password/send_otp.dto';
import { ReSendOtpForgotPasswordDto } from '../dto/forgot_password/resend_otp.dto';
import { VerifyOtpForgotPasswordDto } from '../dto/forgot_password/verify_otp.dto';
import { ChangePasswordForgotPasswordDto } from '../dto/forgot_password/change_password.dto';

@Controller('api/v1/customer-session/user-service')
export class ForgotPasswordController {
    constructor(private readonly forgotPasswordService: ForgotPasswordService) {}

    // 1. (POST) SEND OTP FOR FORGOTPASSWORD
    @Post('forgot-password/otp-sending')
    sendOtpForgotPassword(@Body() sendOtpForgotPasswordDto: SendOtpForgotPasswordDto) {
        return this.forgotPasswordService.sendOtpForgotPassword(sendOtpForgotPasswordDto);
    }

    // 2. (POST) RESEND OTP FOR FORGOTPASSWORD
    @Post('forgot-password/otp-resending')
    reSendOtpForgotPassword(@Body() reSendOtpForgotPasswordDto: ReSendOtpForgotPasswordDto) {
        return this.forgotPasswordService.reSendOtpForgotPassword(reSendOtpForgotPasswordDto);
    }

    // 3. (POST) VERIFY OTP FOR FORGOTPASSWORD
    @Post('forgot-password/otp-verifying')
    async verifyOtp(@Body() dto: VerifyOtpForgotPasswordDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.forgotPasswordService.verifyOtpForgotPassword(dto);

        const cookieName = `reset_token_${result.user_id}`;

        res.cookie(cookieName, result.resetToken, {
            httpOnly: true,
            secure: false, // local development
            sameSite: 'lax',
            maxAge: 2 * 60 * 1000, // 2 phút
        });

        return {
            message: 'Xác thực OTP thành công!',
            user_id: result.user_id,
            reset_expires_at: result.reset_expires_at,
        };
    }

    // 4. (POST) CHANGE PASSWORD FOR FORGOTPASSWORD
    @Post('forgot-password/password-change')
    async changePassword(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: ChangePasswordForgotPasswordDto) {
        const userId = dto.user_id;

        if (!userId) {
            throw new UnauthorizedException('Không tìm thấy thông tin phiên đổi mật khẩu!');
        }

        const cookieName = `reset_token_${userId}`;
        const resetToken = req.cookies?.[cookieName];

        if (!resetToken) {
            throw new UnauthorizedException('Phiên đổi mật khẩu không tồn tại hoặc đã hết hạn!');
        }

        const result = await this.forgotPasswordService.changePassword(resetToken, dto,);

        // Đổi mật khẩu thành công → xóa cookie tương ứng
        res.clearCookie(cookieName, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });

        return result;
    } 
}