import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailService } from './email.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findByEmail(user_email: string) {
    return this.prisma.users.findUnique({
      where: { user_email },
    });
  }

  async findByPhone(user_phone: string) {
    return this.prisma.users.findUnique({
      where: { user_phone },
    });
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(
    dto: SendOtpDto,
  ): Promise<{ message: string; otp_expires_at: Date }> {
    const existedUser = await this.findByEmail(dto.user_email);

    if (existedUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const pendingOtp = await this.prisma.registration_Otps.findFirst({
      where: {
        otp_user_email: dto.user_email,
        otp_status: 'PENDING',
      },
      orderBy: {
        otp_created_at: 'desc',
      },
    });

    if (pendingOtp && pendingOtp.otp_expires_at > new Date()) {
      throw new ConflictException(
        'Tài khoản này đang được đăng ký trên một nơi khác.',
      );
    }

    // Chỉ dùng tạm để test race condition
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    // OTP PENDING cũ đã hết hạn thì xóa trước khi tạo OTP mới
    if (pendingOtp) {
      await this.prisma.registration_Otps.delete({
        where: { otp_id: pendingOtp.otp_id },
      });
    }

    const otp = this.generateOtp();
    const otpHashedPassword = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 phút

    try {
      await this.prisma.registration_Otps.create({
        data: {
          otp_user_email: dto.user_email,
          otp_code_hash: otpHashedPassword,
          otp_status: 'PENDING',
          otp_expires_at: expiresAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Tài khoản này đang được đăng ký trên một nơi khác.',
        );
      }

      throw error;
    }

    // Gửi email
    try {
      await this.emailService.sendOtpEmail(dto.user_email, otp);
    } catch (error) {
      throw new InternalServerErrorException('Không thể gửi OTP. Vui lòng thử lại.');
    }

    return {
      message: 'OTP đã được gửi đến email của bạn',
      otp_expires_at: expiresAt,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string; user_id: number }> {
    // Kiểm tra email chưa được đăng ký
    const existedUser = await this.findByEmail(dto.user_email);
    if (existedUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    // Kiểm tra số điện thoại chưa được đăng ký
    const existedPhone = await this.findByPhone(dto.user_phone);
    if (existedPhone) {
      throw new BadRequestException('Số điện thoại đã tồn tại');
    }

    // Lấy OTP record
    const otpRecord = await this.prisma.registration_Otps.findFirst({
      where: {
        otp_user_email: dto.user_email,
        otp_status: 'PENDING',
      },
      orderBy: {
        otp_created_at: 'desc',
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP không tồn tại hoặc đã hết hạn');
    }

    // Kiểm tra OTP hết hạn
    if (new Date() > otpRecord.otp_expires_at) {
      throw new BadRequestException('OTP đã hết hạn');
    }

    // Kiểm tra attempts
    if (otpRecord.otp_attempts >= 5) {
      await this.prisma.registration_Otps.update({
        where: { otp_id: otpRecord.otp_id },
        data: { otp_status: 'FAILED' },
      });
      throw new BadRequestException('Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu OTP mới.');
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(dto.otp_code, otpRecord.otp_code_hash);

    if (!isOtpValid) {
      await this.prisma.registration_Otps.update({
        where: { otp_id: otpRecord.otp_id },
        data: { otp_attempts: otpRecord.otp_attempts + 1 },
      });
      throw new UnauthorizedException('OTP không đúng');
    }

    // OTP hợp lệ, tạo tài khoản
    const hashedPassword = await bcrypt.hash(dto.user_password_hash, 10);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.users.create({
          data: {
            user_name: dto.user_name,
            user_phone: dto.user_phone,
            user_email: dto.user_email,
            user_password_hash: hashedPassword,
            user_type: 'CUSTOMER',
            user_status: 'ACTIVE',
          },
        });

        const customerRole = await tx.roles.findUnique({
          where: { role_name: 'CUSTOMER' },
        });

        if (!customerRole) {
          throw new InternalServerErrorException(
            'Vai trò CUSTOMER chưa được cấu hình',
          );
        }

        await tx.user_Roles.create({
          data: {
            user_id: createdUser.user_id,
            role_id: BigInt(1), // CUSTOMER
          },
        });

        await tx.registration_Otps.update({
          where: { otp_id: otpRecord.otp_id },
          data: {
            otp_status: 'VERIFIED',
            otp_verified_at: new Date(),
          },
        });

        return createdUser;
      });

      return {
        message: 'Đăng ký tài khoản thành công',
        user_id: Number(user.user_id),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Đăng ký thất bại');
    }
  }
}
