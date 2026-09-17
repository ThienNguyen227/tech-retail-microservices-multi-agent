import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BranchStatus, DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(data: any): any {
    return JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  // Lấy danh sách tất cả chi nhánh (có thể lọc theo trạng thái nếu muốn)
  async findAll(status?: BranchStatus) {
    const branches = await this.prisma.branch.findMany({
      where: status ? { branch_status: status } : undefined,
      include: {
        address: true,
        businessHours: true,
      },
      orderBy: {
        branch_created_at: 'desc',
      },
    });

    return this.serialize(branches);
  }
}