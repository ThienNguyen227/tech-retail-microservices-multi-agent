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
  // Register 
  async sendOtp(dto: SendOtpDto): Promise<{ message: string; otp_expires_at: Date }> {
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
  // Register
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

    let user: any;

    try {
      user = await this.prisma.$transaction(async (tx) => {
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

      const response = await fetch(
        `http://localhost:3002/internal/customer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_user_id: user.user_id.toString(),
          }),
        },
      );

      if (!response.ok) {
        throw new InternalServerErrorException(
          'Tạo thông tin khách hàng thất bại',
        );
      }

      return {
        message: 'Đăng ký tài khoản thành công',
        user_id: Number(user.user_id),
      };
    } catch (error) {
      // =========================
      // 4. Compensation
      // =========================
      if (user) {
        await this.prisma.$transaction(async (tx) => {
          // Xóa các role của user
          await tx.user_Roles.deleteMany({
            where: {
              user_id: user.user_id,
            },
          });

          // Xóa user
          await tx.users.delete({
            where: {
              user_id: user.user_id,
            },
          });

          // Xóa toàn bộ OTP liên quan đến email
          await tx.registration_Otps.deleteMany({
            where: {
              otp_user_email: dto.user_email,
            },
          });
        });
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Đăng ký thất bại');
    }
  }

  // Forgot-password
  async sendForgotPasswordOtp(dto: SendOtpDto,): Promise<{ message: string; otp_expires_at: Date }> {
    const user = await this.findByEmail(dto.user_email);

    if (!user) {
      throw new BadRequestException("Tài khoản không tồn tại");
    }

    // Kiểm tra OTP quên mật khẩu đang chờ xác thực.
    const pendingOtp = await this.prisma.otps.findFirst({
      where: {
        otp_user_id: user.user_id,
        otp_purpose: "FORGOT_PASSWORD",
        otp_status: "PENDING",
      },
      orderBy: {
        otp_created_at: "desc",
      },
    });

    // OTP còn hạn: chặn yêu cầu từ nơi khác.
    if (pendingOtp && pendingOtp.otp_expires_at > new Date()) {
      throw new ConflictException(
        "Tài khoản đang thực hiện quá trình đổi mật khẩu ở nơi khác.",
      );
    }

    // OTP PENDING cũ đã hết hạn: chuyển thành EXPIRED để tạo OTP mới.
    if (pendingOtp) {
      await this.prisma.otps.update({
        where: {
          otp_id: pendingOtp.otp_id,
        },
        data: {
          otp_status: "EXPIRED",
        },
      });
    }

    const otp = this.generateOtp();
    const otpCodeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 60 * 1000);

    let createdOtp;

    try {
      createdOtp = await this.prisma.$transaction(async (tx) => {
        // Nếu trước đó OTP đã VERIFIED nhưng người dùng chưa đổi mật khẩu,
        // yêu cầu OTP mới sẽ làm OTP VERIFIED cũ không còn dùng được.
        await tx.otps.updateMany({
          where: {
            otp_user_id: user.user_id,
            otp_purpose: "FORGOT_PASSWORD",
            otp_status: "VERIFIED",
          },
          data: {
            otp_status: "EXPIRED",
          },
        });

        return tx.otps.create({
          data: {
            otp_user_id: user.user_id,
            otp_code_hash: otpCodeHash,
            otp_purpose: "FORGOT_PASSWORD",
            otp_status: "PENDING",
            otp_expires_at: expiresAt,
          },
        });
      });
    } catch (error) {
      // Lỗi này xảy ra khi có request khác vừa tạo OTP PENDING trước đó.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Tài khoản đang thực hiện quá trình đổi mật khẩu ở nơi khác.",
        );
      }

      throw error;
    }

    try {
      await this.emailService.sendOtpEmail(dto.user_email, otp);
    } catch {
      // Email gửi lỗi thì OTP này không nên tiếp tục chặn user.
      await this.prisma.otps.update({
        where: {
          otp_id: createdOtp.otp_id,
        },
        data: {
          otp_status: "FAILED",
        },
      });

      throw new InternalServerErrorException(
        "Không thể gửi OTP. Vui lòng thử lại.",
      );
    }

    return {
      message: "OTP đã được gửi đến email của bạn",
      otp_expires_at: createdOtp.otp_expires_at,
    };
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
}
