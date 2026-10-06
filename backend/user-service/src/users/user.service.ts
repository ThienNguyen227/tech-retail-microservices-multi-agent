import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailService } from './email.service';
import { Prisma } from '@prisma/client';
import { ChangePasswordDto } from "./dto/change-password.dto";
import { VerifyForgotPasswordOtpDto } from "./dto/verify-forgot-password-otp.dto";
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from "./dto/logout.dto";
import { sign, verify } from 'jsonwebtoken';
import type { JwtPayload } from "jsonwebtoken";
import { randomUUID } from 'crypto';
import { UpdateAccountDto } from "./dto/update-account.dto";

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

  // Forgot-password
  async verifyForgotPasswordOtp(dto: VerifyForgotPasswordOtpDto): Promise<{ message: string; user_id: number }> {
    const user = await this.findByEmail(dto.user_email);

    if (!user) {
      throw new BadRequestException("Tài khoản không tồn tại");
    }

    const otpRecord = await this.prisma.otps.findFirst({
      where: {
        otp_user_id: user.user_id,
        otp_purpose: "FORGOT_PASSWORD",
        otp_status: "PENDING",
      },
      orderBy: {
        otp_created_at: "desc",
      },
    });

    if (!otpRecord) {
      throw new BadRequestException("OTP không tồn tại hoặc đã được sử dụng");
    }

    if (new Date() > otpRecord.otp_expires_at) {
      await this.prisma.otps.update({
        where: { otp_id: otpRecord.otp_id },
        data: { otp_status: "EXPIRED" },
      });

      throw new BadRequestException("OTP đã hết hạn");
    }

    if (otpRecord.otp_attempts >= 5) {
      await this.prisma.otps.update({
        where: { otp_id: otpRecord.otp_id },
        data: { otp_status: "FAILED" },
      });

      throw new BadRequestException(
        "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới.",
      );
    }

    const isOtpValid = await bcrypt.compare(
      dto.otp_code,
      otpRecord.otp_code_hash,
    );

    if (!isOtpValid) {
      await this.prisma.otps.update({
        where: { otp_id: otpRecord.otp_id },
        data: {
          otp_attempts: otpRecord.otp_attempts + 1,
        },
      });

      throw new UnauthorizedException("OTP không đúng");
    }

    await this.prisma.otps.update({
      where: { otp_id: otpRecord.otp_id },
      data: {
        otp_status: "VERIFIED",
        otp_verified_at: new Date(),
      },
    });

    return {
      message: "Xác thực OTP thành công",
      user_id: Number(user.user_id),
    };
  }
  // Forget-password
  async changePassword(dto: ChangePasswordDto,): Promise<{ message: string }> {
    const hashedPassword = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: {
          user_email: dto.user_email,
        },
      });

      if (!user) {
        throw new BadRequestException("Tài khoản không tồn tại");
      }

      // Chỉ cho phép đổi mật khẩu nếu OTP quên mật khẩu đã được xác thực.
      const verifiedOtp = await tx.otps.findFirst({
        where: {
          otp_user_id: user.user_id,
          otp_purpose: "FORGOT_PASSWORD",
          otp_status: "VERIFIED",
        },
        orderBy: {
          otp_verified_at: "desc",
        },
      });

      if (!verifiedOtp) {
        throw new UnauthorizedException(
          "Bạn chưa xác thực OTP để đổi mật khẩu",
        );
      }

      // if (new Date() > verifiedOtp.otp_expires_at) {
      //   throw new BadRequestException(
      //     "OTP đã hết hạn. Vui lòng yêu cầu mã OTP mới.",
      //   );
      // }

      // Đánh dấu OTP đã dùng để không thể dùng lại đổi mật khẩu lần nữa.
      const usedOtp = await tx.otps.updateMany({
        where: {
          otp_id: verifiedOtp.otp_id,
          otp_status: "VERIFIED",
        },
        data: {
          otp_status: "USED",
        },
      });

      if (usedOtp.count === 0) {
        throw new BadRequestException(
          "OTP đã được sử dụng. Vui lòng yêu cầu mã OTP mới.",
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

    return {
      message: "Đổi mật khẩu thành công",
    };
  }
  //Login
  async login(dto: LoginDto, deviceInfo?: string, ipAddress?: string,): Promise<{
    access_token: string;
    refresh_token: string;
    user_name: string;
    user_id: string;
    token_type: 'Bearer';
    expires_in: number;}> {
    const user = await this.prisma.users.findUnique({
      where: { user_email: dto.user_email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.user_status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.user_password,
      user.user_password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException(
        'JWT secret chưa được cấu hình',
      );
    }

    const sessionId = randomUUID();
    const userId = user.user_id.toString();

    const refreshToken = sign(
      {
        sub: userId,
        sid: sessionId,
        type: 'refresh',
      },
      refreshSecret,
      { expiresIn: '7d' },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000,);

    await this.prisma.sessions.create({
      data: {
        session_id: sessionId,
        session_user_id: user.user_id,
        session_refresh_token_hash: refreshTokenHash,
        session_device_info: deviceInfo,
        session_ip_address: ipAddress,
        session_expires_at: refreshTokenExpiresAt,
      },
    });

    const accessToken = sign(
      {
        sub: userId,
        sid: sessionId,
        user_name: user.user_name,
        user_id: userId,
        user_type: user.user_type,
        type: 'access',
      },
      accessSecret,
      { expiresIn: '15m' },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user_name: user.user_name,
      user_id: userId,
      token_type: 'Bearer',
      expires_in: 15 * 60,
    };
  }
  // Refresh token
  async refresh(refreshToken?: string): Promise<{
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
  }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException(
        'JWT secret chưa được cấu hình',
      );
    }

    let payload: JwtPayload | string;

    try {
      payload = verify(refreshToken, refreshSecret);
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    if (
      typeof payload === 'string' ||
      payload.type !== 'refresh' ||
      typeof payload.sid !== 'string' ||
      typeof payload.sub !== 'string'
    ) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const session = await this.prisma.sessions.findUnique({
      where: { session_id: payload.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.session_revoked_at ||
      session.session_expires_at < new Date() ||
      session.session_user_id.toString() !== payload.sub
    ) {
      throw new UnauthorizedException('Session không hợp lệ hoặc đã hết hạn');
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      session.session_refresh_token_hash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = session.user;

    if (!user || user.user_status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    // Chỉ tạo access token mới, không tạo refresh token mới.
    const accessToken = sign(
      {
        sub: user.user_id.toString(),
        sid: session.session_id,
        user_name: user.user_name,
        user_id: user.user_id.toString(),
        user_type: user.user_type,
        type: 'access',
      },
      accessSecret,
      { expiresIn: '15m' },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
    };
  }
  // Logout
  async logout(dto: LogoutDto): Promise<{ message: string }> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!refreshSecret) {
      throw new InternalServerErrorException(
        "JWT refresh secret chưa được cấu hình",
      );
    }

    let payload: JwtPayload | string;

    try {
      payload = verify(dto.refresh_token, refreshSecret);
    } catch {
      throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    if (
      typeof payload === "string" ||
      payload.type !== "refresh" ||
      typeof payload.sid !== "string" ||
      typeof payload.sub !== "string"
    ) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    const session = await this.prisma.sessions.findUnique({
      where: {
        session_id: payload.sid,
      },
    });

    if (!session) {
      throw new UnauthorizedException("Session không tồn tại");
    }

    if (session.session_user_id.toString() !== payload.sub) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    if (session.session_revoked_at) {
      return { message: "Đã đăng xuất trước đó" };
    }

    if (session.session_expires_at < new Date()) {
      throw new UnauthorizedException("Session đã hết hạn");
    }

    const isRefreshTokenValid = await bcrypt.compare(
      dto.refresh_token,
      session.session_refresh_token_hash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    await this.prisma.sessions.update({
      where: {
        session_id: session.session_id,
      },
      data: {
        session_revoked_at: new Date(),
      },
    });

    return {
      message: "Đăng xuất thành công",
    };
  }

  // Get My Profile
  async getMyProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        user_id: BigInt(userId),
      },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
        user_phone: true,
        user_type: true,
        user_status: true,
        user_created_at: true,
        user_updated_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Tài khoản không tồn tại");
    }

    return {
      ...user,
      user_id: user.user_id.toString(),
    };
  }
    // Update My Profile
  async updateMyProfile(userId: string, dto: UpdateAccountDto) {
    const id = BigInt(userId);

    if (!dto.user_name && !dto.user_phone) {
      throw new BadRequestException(
        "Vui lòng cung cấp ít nhất một thông tin cần cập nhật",
      );
    }

    if (dto.user_phone) {
      const phoneOwner = await this.prisma.users.findUnique({
        where: {
          user_phone: dto.user_phone,
        },
        select: {
          user_id: true,
        },
      });

      if (phoneOwner && phoneOwner.user_id !== id) {
        throw new ConflictException("Số điện thoại đã được sử dụng");
      }
    }

    try {
      const user = await this.prisma.users.update({
        where: {
          user_id: id,
        },
        data: {
          ...(dto.user_name ? { user_name: dto.user_name } : {}),
          ...(dto.user_phone ? { user_phone: dto.user_phone } : {}),
        },
        select: {
          user_id: true,
          user_name: true,
          user_email: true,
          user_phone: true,
          user_type: true,
          user_status: true,
          user_created_at: true,
          user_updated_at: true,
        },
      });

      return {
        ...user,
        user_id: user.user_id.toString(),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Số điện thoại đã được sử dụng");
      }

      throw error;
    }
  }
}
