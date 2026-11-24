import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BranchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchAddressService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================================
  // GET BRANCH ADDRESS BY ID
  // ========================================================

  async findAddressByBranchId(branchId: string) {
    // 1. VALIDATE BRANCH ID

    if (!/^[1-9]\d*$/.test(branchId)) {
      throw new BadRequestException(
        'Branch ID không hợp lệ.',
      );
    }

    // 2. FIND BRANCH ADDRESS

    const branch = await this.prisma.branch.findUnique({
      where: {
        branch_id: BigInt(branchId),
      },

      select: {
        branch_id: true,
        branch_status: true,

        address: {
          select: {
            branch_address_address_line: true,
            branch_address_ward: true,
            branch_address_province: true,
          },
        },
      },
    });

    // 3. CHECK BRANCH EXISTS

    if (!branch) {
      throw new NotFoundException(
        'Không tìm thấy chi nhánh.',
      );
    }

    // 4. CHECK BRANCH STATUS

    if (branch.branch_status !== BranchStatus.ACTIVE) {
      throw new ConflictException(
        'Chi nhánh hiện không hoạt động.',
      );
    }

    // 5. CHECK BRANCH ADDRESS

    if (!branch.address) {
      throw new NotFoundException(
        'Chi nhánh chưa có thông tin địa chỉ.',
      );
    }

    // 6. RETURN BRANCH ADDRESS

    return {
      success: true,
      data: {
        branchId: branch.branch_id.toString(),

        addressLine:
          branch.address.branch_address_address_line,

        ward:
          branch.address.branch_address_ward,

        province:
          branch.address.branch_address_province,
      },
    };
  }
}