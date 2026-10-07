import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import axios from 'axios';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RedisService } from '../../redis/redis.service';

import { SendOtpForgotPasswordDto } from '../dto/forgot_password/send_otp.dto';
import { ReSendOtpForgotPasswordDto } from '../dto/forgot_password/resend_otp.dto';
import { VerifyOtpForgotPasswordDto } from '../dto/forgot_password/verify_otp.dto';
import { ChangePasswordForgotPasswordDto } from '../dto/forgot_password/change_password.dto';


@Injectable()
export class ForgotPasswordService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService, private readonly redisService: RedisService) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async findByEmail(user_email: string) {
    return this.prisma.users.findUnique({
      where: { user_email },
      select: {
        user_id: true,
        user_email: true,
      },
    });
  }

  async findByPhone(user_phone: string) {
    return this.prisma.users.findUnique({
      where: { user_phone },
      select: {
        user_phone: true,
      },
    });
  }

  // 1. Send OTP
  async sendOtpForgotPassword(dto: SendOtpForgotPasswordDto): Promise<{ message: string; otp_expires_at: Date }> {

    // 1. Kiểm tra email có tồn tại trong hệ thống không
    const existedUser = await this.findByEmail(dto.user_email);

    if (!existedUser) {
      throw new BadRequestException(
        'Email không tồn tại trong hệ thống!',
      );
    }

    // 2. Key lưu OTP trong Redis
    const redisKey = `forgot-password:otp:${dto.user_email}`;

    // 3. Generate OTP
    const otp = this.generateOtp();

    // 4. Hash OTP
    const otpCodeHash = await bcrypt.hash(otp, 10);

    // 5. Lưu OTP vào Redis, hết hạn sau 60 giây
    const saved = await this.redisService.setIfNotExists(
      redisKey,
      otpCodeHash,
      60,
    );

    if (!saved) {
      throw new ConflictException(
        'Tài khoản này đang được yêu cầu đặt lại mật khẩu ở một nơi khác!',
      );
    }

    // 6. Thời gian hết hạn
    const expiresAt = new Date(Date.now() + 60 * 1000);

    // 7. Gửi OTP
    try {
      await this.emailService.sendOtpEmailForgotPassword(
        dto.user_email,
        otp,
      );
    } catch (error) {

      // Gửi email thất bại → xóa OTP
      await this.redisService.delete(redisKey);

      throw new InternalServerErrorException(
        'Không thể gửi OTP. Vui lòng thử lại sau!',
      );
    }

    return {
      message: 'OTP đã được gửi đến email của người dùng!',
      otp_expires_at: expiresAt,
    };
  }


  // 2. Resend OTP Forgot Password
  async reSendOtpForgotPassword(dto: ReSendOtpForgotPasswordDto): Promise<{ message: string; otp_expires_at: Date }> {

    const redisKey = `forgot-password:otp:${dto.user_email}`;

    // 1. Generate OTP mới
    const otp = this.generateOtp();

    // 2. Hash OTP
    const otpCodeHash = await bcrypt.hash(otp, 10);

    // 3. Lưu OTP mới vào Redis
    const saved = await this.redisService.setIfNotExists(
      redisKey,
      otpCodeHash,
      60,
    );

    if (!saved) {
      throw new ConflictException(
        'Email này đang trong quá trình xác nhận OTP!',
      );
    }

    // 4. Thời gian hết hạn OTP
    const expiresAt = new Date(Date.now() + 60 * 1000);

    // 5. Gửi OTP qua email
    try {
      await this.emailService.sendOtpEmailForgotPassword(
        dto.user_email,
        otp,
      );
    } catch (error) {
      // Gửi email thất bại → xóa OTP khỏi Redis
      await this.redisService.delete(redisKey);

      throw new InternalServerErrorException(
        'Không thể gửi OTP. Vui lòng thử lại sau!',
      );
    }

    return {
      message: 'OTP mới đã được gửi đến email của người dùng!',
      otp_expires_at: expiresAt,
    };
  }

  // 3. Verify OTP
  async verifyOtpForgotPassword(dto: VerifyOtpForgotPasswordDto): Promise<{resetToken: string; reset_expires_at: Date;}> {

    // 1. Kiểm tra email tồn tại
    const existedUser = await this.findByEmail(dto.user_email);

    if (!existedUser) {
      throw new BadRequestException(
        'Email không tồn tại trong hệ thống!',
      );
    }

    // 2. Redis keys
    const redisKey = `forgot-password:otp:${dto.user_email}`;
    const attemptsKey = `forgot-password:otp:attempts:${dto.user_email}`;

    // 3. Lấy OTP hash
    const otpCodeHash = await this.redisService.get(redisKey);

    if (!otpCodeHash) {
      throw new BadRequestException(
        'OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu OTP mới!',
      );
    }

    // 4. Kiểm tra OTP
    const isOtpValid = await bcrypt.compare(
      dto.otp_code,
      otpCodeHash,
    );

    if (!isOtpValid) {
      const attemptsValue = await this.redisService.get(attemptsKey);

      const attempts = attemptsValue ? Number(attemptsValue) : 0;

      const newAttempts = attempts + 1;

      // Sai đủ 5 lần
      if (newAttempts >= 5) {
        await this.redisService.delete(redisKey);
        await this.redisService.delete(attemptsKey);

        throw new UnauthorizedException(
          'Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu OTP mới!',
        );
      }

      await this.redisService.set(
        attemptsKey,
        newAttempts.toString(),
        60,
      );

      throw new UnauthorizedException(
        `OTP không đúng. Bạn còn ${5 - newAttempts} lần thử!`,
      );
    }

    // 5. OTP đúng → xóa OTP + attempts
    await this.redisService.delete(redisKey);
    await this.redisService.delete(attemptsKey);

    // 6. Tạo reset token
    const resetToken = crypto.randomUUID();

    // 7. Chỉ cho phép 1 phiên reset/email
    const resetSessionKey =
      `forgot-password:reset-session:${dto.user_email}`;

    const saved = await this.redisService.setIfNotExists(
      resetSessionKey,
      resetToken,
      120,
    );

    if (!saved) {
      throw new ConflictException(
        'Email này đang có một phiên đổi mật khẩu khác!',
      );
    }

    // 8. Token → userId
    const resetTokenKey =
      `forgot-password:reset-token:${resetToken}`;

    await this.redisService.set(
      resetTokenKey,
      String(existedUser.user_id),
      120,
    );

    // Thời điểm hết hạn
    const resetExpiresAt = new Date(
      Date.now() + 120 * 1000,
    );

    // 9. Chỉ trả token về Controller để Controller
    // đặt vào HttpOnly Cookie
    return {
      resetToken,
      reset_expires_at: resetExpiresAt,
    };
  }

  // 4. Change Password
  async changePassword(resetToken: string, dto: ChangePasswordForgotPasswordDto): Promise<{ message: string }> {

    // 1. Kiểm tra reset token
    const resetTokenKey = `forgot-password:reset-token:${resetToken}`;

    const userId = await this.redisService.get(resetTokenKey);

    if (!userId) {
      throw new UnauthorizedException(
        'Phiên đổi mật khẩu không hợp lệ hoặc đã hết hạn!',
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.new_password, 10);

    

    // 3. Update password trong transaction
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: {
          user_id: BigInt(userId),
        },
        select: {
          user_id: true,
        },
      });

      if (!user) {
        throw new BadRequestException(
          'Tài khoản không tồn tại!',
        );
      }

      await tx.users.update({
        where: {
          user_id: user.user_id,
        },
        data: {
          user_password_hash: hashedPassword,
        },
      });
    });

    // 4. DB đã commit thành công → mới xóa reset token
    await this.redisService.delete(resetTokenKey);

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }
}