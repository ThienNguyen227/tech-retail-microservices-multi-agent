import { BadRequestException, ConflictException, Injectable} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from "../dto/update_profile/update_profile.dto"

@Injectable()
export class UpdateProfileService {
    constructor(private readonly prisma: PrismaService) {}

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const id = BigInt(userId);

        if (dto.user_name === undefined && dto.user_phone === undefined) {
            throw new BadRequestException(
            "Vui lòng cung cấp ít nhất một thông tin cần cập nhật!",
            );
        }

        if (dto.user_phone !== undefined) {
            const phoneOwner = await this.prisma.users.findUnique({
            where: { user_phone: dto.user_phone },
            select: { user_id: true },
            });

            if (phoneOwner && phoneOwner.user_id !== id) {
            throw new ConflictException("Số điện thoại đã được sử dụng!");
            }
        }

        try {
            const user = await this.prisma.users.update({
            where: { user_id: id },
            data: {
                ...(dto.user_name !== undefined && {
                user_name: dto.user_name,
                }),
                ...(dto.user_phone !== undefined && {
                user_phone: dto.user_phone,
                }),
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
            throw new ConflictException("Số điện thoại đã được sử dụng!");
            }

            throw error;
        }
        }
}
