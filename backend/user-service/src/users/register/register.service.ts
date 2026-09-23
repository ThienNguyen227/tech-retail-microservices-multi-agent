import { Injectable, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email.service';
import { RegisterRepository } from './register.repository';

import { SendOtpDto } from '../dto/send-otp.dto';

// @Injectable()
// export class RegisterService {
//     constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}

//     async findByEmail(user_email: string) {
//         return this.prisma.users.findUnique({
//         where: { user_email },
//         });
//     }

//     async findByPhone(user_phone: string) {
//         return this.prisma.users.findUnique({
//         where: { user_phone },
//         });
//     }

//     private generateOtp(): string {
//         return Math.floor(100000 + Math.random() * 900000).toString();
//     }

//     async sendOtp(dto: SendOtpDto): Promise<{ message: string; otp_expires_at: Date }> {
//         const existedUser = await this.findByEmail(dto.user_email);

//         if (existedUser) {
//             throw new BadRequestException('Email đã tồn tại');
//         }

//         const pendingOtp = await this.prisma.registration_Otps.findFirst({
//         where: {
//             otp_user_email: dto.user_email,
//             otp_status: 'PENDING',
//         },
//         orderBy: {
//             otp_created_at: 'desc',
//         },
//         });

//         if (pendingOtp && pendingOtp.otp_expires_at > new Date()) {
//             throw new ConflictException(
//                 'Tài khoản này đang được đăng ký trên một nơi khác.',
//             );
//         }

//         // OTP PENDING cũ đã hết hạn thì xóa trước khi tạo OTP mới
//         if (pendingOtp) {
//         await this.prisma.registration_Otps.delete({
//             where: { otp_id: pendingOtp.otp_id },
//         });
//         }

//         const otp = this.generateOtp();
//         const otpHashedPassword = await bcrypt.hash(otp, 10);
//         const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 phút

//         try {
//             await this.prisma.registration_Otps.create({
//                 data: {
//                 otp_user_email: dto.user_email,
//                 otp_code_hash: otpHashedPassword,
//                 otp_status: 'PENDING',
//                 otp_expires_at: expiresAt,
//                 },
//             });
//         } catch (error) {
//             if (
//                 error instanceof Prisma.PrismaClientKnownRequestError &&
//                 error.code === 'P2002'
//             ) {
//                 throw new ConflictException(
//                 'Tài khoản này đang được đăng ký trên một nơi khác.',
//                 );
//             }

//         throw error;
//         }

//         // Gửi email
//         try {
//             await this.emailService.sendOtpEmail(dto.user_email, otp);
//         } catch (error) {
//             throw new InternalServerErrorException('Không thể gửi OTP. Vui lòng thử lại.');
//         }

//         return {
//             message: 'OTP đã được gửi đến email của bạn',
//             otp_expires_at: expiresAt,
//         };
//     }
// }

@Injectable()
export class RegisterService {
    constructor(
        private readonly registerRepository: RegisterRepository,
        private readonly emailService: EmailService,
    ) {}

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Business logic
    // 1. Kiểm tra email
    // 2. Kiểm tra số điện thoại
    // 3. Kiểm tra OTP đang pending
    // 4. Xóa OTP cũ nếu đã hết hạn
    // 5. Generate OTP
    // 6. Hash OTP
    // 7. Lưu OTP vào DB
    // 8. Gửi OTP qua email

    async sendOtp(
        dto: SendOtpDto,
    ): Promise<{ message: string; otp_expires_at: Date }> {
        // 1. Kiểm tra email đã tồn tại
        const existedUserEmail =
            await this.registerRepository.findByEmail(dto.user_email);

        if (existedUserEmail) {
            throw new BadRequestException('Email đã tồn tại!');
        }

        // 2. Kiểm tra số điện thoại đã tồn tại
        // const existedUserPhoneNumber =
        //     await this.registerRepository.findByPhone(dto.user_phone);

        // if (existedUserPhoneNumber) {
        //     throw new BadRequestException('Số điện thoại đã tồn tại!');
        // }

        // 3. Kiểm tra OTP đang PENDING
        const pendingOtp =
            await this.registerRepository.findPendingOtp(dto.user_email);

        if (
            pendingOtp &&
            pendingOtp.otp_expires_at > new Date()
        ) {
            throw new ConflictException(
                'Tài khoản này đang được đăng ký trên một nơi khác!',
            );
        }

        // 4. Xóa OTP cũ nếu đã hết hạn
        if (pendingOtp) {
            await this.registerRepository.deleteOtp(
                pendingOtp.otp_id,
            );
        }

        // 5. Generate OTP
        const otp = this.generateOtp();

        // 6. Hash OTP
        const otpCodeHash = await bcrypt.hash(otp, 10);

        // OTP có hiệu lực 1 phút
        const expiresAt = new Date(
            Date.now() + 1 * 60 * 1000,
        );

        // 7. Lưu OTP vào DB
        try {
            await this.registerRepository.createOtp({
                otp_user_email: dto.user_email,
                otp_code_hash: otpCodeHash,
                otp_status: 'PENDING',
                otp_expires_at: expiresAt,
            });
        } catch (error) {
            // Xử lý trường hợp 2 request cùng lúc
            // dẫn đến vi phạm UNIQUE constraint
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'Tài khoản này đang được đăng ký trên một nơi khác!',
                );
            }

            throw error;
        }

        // 8. Gửi OTP qua email
        try {
            await this.emailService.sendOtpEmail(
                dto.user_email,
                otp,
            );
        } catch (error) {
            throw new InternalServerErrorException(
                'Không thể gửi OTP. Vui lòng thử lại.',
            );
        }

        return {
            message: 'OTP đã được gửi đến email của bạn',
            otp_expires_at: expiresAt,
        };
    }
}