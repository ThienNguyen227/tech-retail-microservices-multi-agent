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
import { ReSendOtpDto } from '../dto/register/resend_otp.dto';
import { VerifyOtpDto } from '../dto/register/verify_otp.dto';

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

  // // 2. Resend OTP
  // async resendOtp(dto: ReSendOtpDto): Promise<{ message: string; otp_expires_at: Date }> {

  //   const redisKey = `register:otp:${dto.user_email}`;

  //   // 2. Generate OTP mới
  //   const otp = this.generateOtp();

  //   // 3. Hash OTP
  //   const otpCodeHash = await bcrypt.hash(otp, 10);

  //   // TEST: 1. Trả lỗi Server Phản hồi quá lâu, 2. Trace condition 
  //   // await new Promise((resolve) => setTimeout(resolve, 5_000));

  //   // 5. Lưu OTP mới, hết hạn sau 60 giây
  //   const saved = await this.redisService.setIfNotExists(redisKey, otpCodeHash, 60);

  //   if (!saved) 
  //   {
  //     throw new ConflictException('Tài khoản này đang được đăng ký ở một nơi khác!');
  //   }

  //   // 6. Thời gian hết hạn
  //   const expiresAt = new Date(Date.now() + 60 * 1000);

  //   // 7. Gửi OTP mới
  //   try {
  //     await this.emailService.sendOtpEmail(dto.user_email, otp);
  //   } catch (error) {
  //     // Gửi thất bại → xóa OTP mới
  //     await this.redisService.delete(redisKey);

  //     throw new InternalServerErrorException('Không thể gửi OTP. Vui lòng thử lại sau!');
  //   }

  //   return {message: 'OTP mới đã được gửi đến email của người dùng!', otp_expires_at: expiresAt};
  // }

  // // 3. Verify OTP
  // async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {

  //   // 1. Kiểm tra email đã tồn tại chưa
  //   const existedUser = await this.findByEmail(dto.user_email);

  //   if (existedUser) {
  //     throw new BadRequestException('Email đã tồn tại!');
  //   }

  //   // 2. Kiểm tra số điện thoại đã tồn tại chưa
  //   const existedPhone = await this.findByPhone(dto.user_phone);

  //   if (existedPhone) {
  //     throw new BadRequestException('Số điện thoại đã tồn tại!');
  //   }

  //   // 3. Key OTP và số lần nhập sai
  //   const redisKey = `register:otp:${dto.user_email}`;
  //   const attemptsKey = `register:otp:attempts:${dto.user_email}`;

  //   // 4. Lấy OTP hash từ Redis
  //   const otpCodeHash = await this.redisService.get(redisKey);

  //   if (!otpCodeHash) {
  //     throw new BadRequestException(
  //       'OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu OTP mới!',
  //     );
  //   }

  //   // 5. Kiểm tra OTP
  //   const isOtpValid = await bcrypt.compare(dto.otp_code, otpCodeHash);

  //   if (!isOtpValid) {

  //     // Lấy số lần sai hiện tại
  //     const attemptsValue = await this.redisService.get(attemptsKey);

  //     const attempts = attemptsValue ? Number(attemptsValue) : 0;

  //     const newAttempts = attempts + 1;

  //     // Đã sai đủ 5 lần
  //     if (newAttempts >= 5) {

  //       // Xóa OTP và số lần sai
  //       await this.redisService.delete(redisKey);
  //       await this.redisService.delete(attemptsKey);

  //       throw new UnauthorizedException('Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu OTP mới!');
  //     }

  //     // Lưu số lần sai
  //     await this.redisService.set(attemptsKey, newAttempts.toString(), 60);

  //     throw new UnauthorizedException(`OTP không đúng. Bạn còn ${5 - newAttempts} lần thử!`);
  //   }

  //   // 6. OTP đúng → xóa số lần sai
  //   await this.redisService.delete(attemptsKey);

  //   // 7. Hash password
  //   const hashedPassword = await bcrypt.hash(dto.user_password_hash, 10);

  //   let user: any;

  //   try {

  //     // 8. Tạo User + Role trong transaction
  //     user = await this.prisma.$transaction(async (tx) => {

  //       const createdUser = await tx.users.create({
  //         data: {
  //           user_name: dto.user_name,
  //           user_phone: dto.user_phone,
  //           user_email: dto.user_email,
  //           user_password_hash: hashedPassword,
  //           user_type: 'CUSTOMER',
  //           user_status: 'ACTIVE',
  //         },
  //       });

  //       const customerRole = await tx.roles.findUnique({
  //         where: {
  //           role_name: 'CUSTOMER',
  //         },
  //         select: {
  //           role_id: true,
  //         },
  //       });

  //       if (!customerRole) {
  //         throw new InternalServerErrorException(
  //           'Vai trò CUSTOMER chưa được cấu hình',
  //         );
  //       }

  //       await tx.user_Roles.create({
  //         data: {
  //           user_id: createdUser.user_id,
  //           role_id: customerRole.role_id,
  //         },
  //       });

  //       return createdUser;
  //     });

  //     // 9. OTP đã sử dụng → xóa khỏi Redis
  //     await this.redisService.delete(redisKey);

  //     // 10. Tạo Customer
  //     await axios.post(
  //       'http://localhost:3002/api/v1/internal/customer',
  //       {
  //         customer_user_id: user.user_id.toString(),
  //       },
  //       {
  //         timeout: 10_000,
  //       },
  //     );

  //     return {
  //       message: 'Đăng ký tài khoản thành công',
  //     };

  //   } catch (error) {

  //     // 11. Compensation
  //     if (user) {
  //       await this.prisma.$transaction(async (tx) => {

  //         await tx.user_Roles.deleteMany({
  //           where: {
  //             user_id: user.user_id,
  //           },
  //         });

  //         await tx.users.delete({
  //           where: {
  //             user_id: user.user_id,
  //           },
  //         });
  //       });
  //     }

  //     if (error instanceof HttpException) {
  //       throw error;
  //     }

  //     throw new InternalServerErrorException(
  //       'Đăng ký tài khoản thất bại!',
  //     );
  //   }
  // }
}