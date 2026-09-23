import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RegisterRepository {
    constructor(private readonly prisma: PrismaService) {}

    // 1. Kiểm tra email
    async findByEmail(user_email: string) 
    {
        return this.prisma.users.findUnique({
            where: { user_email },
        });
    }

    // 2. Kiểm tra số điện thoại
    async findByPhone(user_phone: string) 
    {
        return this.prisma.users.findUnique({
            where: { user_phone },
        });
    }

    // 3. Kiểm tra OTP đang Pending
    async findPendingOtp(user_email: string) 
    {
        return this.prisma.registration_Otps.findFirst({
            where: {
                otp_user_email: user_email,
                otp_status: 'PENDING',
            },
            orderBy: {
                otp_created_at: 'desc',
            },
        });
    }

    // 4. Xóa otp
    async deleteOtp(otp_id: bigint) 
    {
        return this.prisma.registration_Otps.delete({
            where: { otp_id },
        });
    }

    // 5. Tạo otp
    async createOtp(data: {otp_user_email: string; otp_code_hash: string; otp_status: 'PENDING'; otp_expires_at: Date}) 
    {
        return this.prisma.registration_Otps.create({data});
    }
}