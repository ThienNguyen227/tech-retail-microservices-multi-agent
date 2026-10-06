import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RedisService } from '../../redis/redis.service';

import { SendOtpDto } from '../dto/register/send_otp.dto';
import { ReSendOtpDto } from '../dto/register/resend_otp.dto';

@Injectable()
export class RegisterService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService, private readonly redisService: RedisService) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 1. Send OTP
  async sendOtp(dto: SendOtpDto): Promise<{ message: string; otp_expires_at: Date }> {

    // 1. Kiểm tra email hoặc số điện thoại đã tồn tại
    const existedUser = await this.prisma.users.findFirst({
        where: {
            OR: [
            { user_email: dto.user_email },
            { user_phone: dto.user_phone },
            ],
        },
        select: {
            user_email: true,
            user_phone: true,
        },
    });

    if (existedUser) {
        if (existedUser.user_email === dto.user_email) {
            throw new BadRequestException('Email đã tồn tại!');
        }

        if (existedUser.user_phone === dto.user_phone) {
            throw new BadRequestException('Số điện thoại đã tồn tại!');
        }
    }

    // TEST: 1. Trả lỗi Server Phản hồi quá lâu, 2. Trace condition 
    // await new Promise((resolve) => setTimeout(resolve, 10_000)); 

    // Key lưu OTP trong Redis
    const redisKey = `register:otp:${dto.user_email}`;

    // 4. Generate OTP
    const otp = this.generateOtp();

    // 5. Hash OTP
    const otpCodeHash = await bcrypt.hash(otp, 10);

    // 6. Lưu OTP vào Redis, hết hạn sau 60 giây
    const saved = await this.redisService.setIfNotExists(redisKey, otpCodeHash, 60);

    if (!saved) 
    {
      throw new ConflictException('Tài khoản này đang được đăng ký ở một nơi khác!');
    }

    // Thời gian hết hạn để trả về client
    const expiresAt = new Date(Date.now() + 60 * 1000);

    // 7. Gửi OTP qua email
    try {
      await this.emailService.sendOtpEmail(dto.user_email, otp);
    } catch (error) {
      // Gửi email thất bại → xóa OTP trong Redis
      await this.redisService.delete(redisKey);

      throw new InternalServerErrorException('Không thể gửi OTP. Vui lòng thử lại sau!');
    }

    return {message: 'OTP đã được gửi đến email của người dùng!', otp_expires_at: expiresAt};
  }

  // 2. Resend OTP
  async resendOtp(dto: ReSendOtpDto): Promise<{ message: string; otp_expires_at: Date }> {

    const redisKey = `register:otp:${dto.user_email}`;

    // 2. Generate OTP mới
    const otp = this.generateOtp();

    // 3. Hash OTP
    const otpCodeHash = await bcrypt.hash(otp, 10);

    // TEST: 1. Trả lỗi Server Phản hồi quá lâu, 2. Trace condition 
    // await new Promise((resolve) => setTimeout(resolve, 5_000));

    // 5. Lưu OTP mới, hết hạn sau 60 giây
    const saved = await this.redisService.setIfNotExists(redisKey, otpCodeHash, 60);

    if (!saved) 
    {
      throw new ConflictException('Tài khoản này đang được đăng ký ở một nơi khác!');
    }

    // 6. Thời gian hết hạn
    const expiresAt = new Date(Date.now() + 60 * 1000);

    // 7. Gửi OTP mới
    try {
      await this.emailService.sendOtpEmail(dto.user_email, otp);
    } catch (error) {
      // Gửi thất bại → xóa OTP mới
      await this.redisService.delete(redisKey);

      throw new InternalServerErrorException('Không thể gửi OTP. Vui lòng thử lại sau!');
    }

    return {message: 'OTP mới đã được gửi đến email của người dùng!', otp_expires_at: expiresAt};
  }
}