import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from '../dto/create_employee/create_employee.dto';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class CreateEmloyeeService {
  constructor(private readonly prisma: PrismaService) {}

  async createEmployee(userId: string, dto: CreateEmployeeDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Kiểm tra quyền employee:create của người thực hiện
        const hasPermission = await tx.user_Roles.findFirst({
          where: {
            user_id: BigInt(userId),
            role: {
              Role_Permissions: {
                some: {
                  permission: {
                    permission_name: 'employee:create',
                  },
                },
              },
            },
          },
        });

        if (!hasPermission) {
          throw new ForbiddenException(
            'Bạn không có quyền tạo nhân viên!',
          );
        }

        // 2. Kiểm tra tài khoản đã tồn tại
        const existingUser = await tx.users.findFirst({
          where: {
            OR: [
              { user_email: dto.user_email },
              { user_phone: dto.user_phone },
            ],
          },
        });

        if (existingUser) {
          throw new ConflictException(
            'Tên tài khoản, email hoặc số điện thoại đã tồn tại!',
          );
        }

        // 3. Kiểm tra vai trò cần gán
        const role = await tx.roles.findUnique({
          where: {
            role_name: dto.role_name,
          },
        });

        if (!role) {
          throw new BadRequestException('Vai trò không tồn tại!');
        }

        // 4. Mã hóa mật khẩu
        const passwordHash = await bcrypt.hash(dto.user_password, 10);

        // 5. Tạo tài khoản
        const user = await tx.users.create({
          data: {
            user_name: dto.user_name,
            user_email: dto.user_email,
            user_phone: dto.user_phone,
            user_password_hash: passwordHash,
            user_status: dto.user_status,
            user_type: 'EMPLOYEE',
          },
        });

        // 6. Gán vai trò
        await tx.user_Roles.create({
          data: {
            user_id: user.user_id,
            role_id: role.role_id,
          },
        });

        // 7. Sinh mã nhân viên
        const employeeCode = `EMP-${randomBytes(4).toString('hex').toUpperCase()}`;

        // 8. Tạo hồ sơ nhân viên
        const employee = await tx.employees.create({
          data: {
            employee_user_id: user.user_id,
            employee_code: employeeCode,
            employee_full_name: dto.employee_full_name,
            employee_gender: dto.employee_gender,
            employee_date_of_birth: new Date(
              dto.employee_date_of_birth,
            ),
            employee_address: dto.employee_address ?? '',
            employee_status: dto.employee_status,
          },
        });

        // 9. Trả kết quả
        return {
          message: 'Tạo nhân viên thành công.',
          data: {
            user_id: user.user_id.toString(),
            user_name: user.user_name,
            user_email: user.user_email,
            user_phone: user.user_phone,
            user_status: user.user_status,
            role_name: role.role_name,
            employee_id: employee.employee_id.toString(),
            employee_code: employee.employee_code,
            employee_full_name: employee.employee_full_name,
            employee_status: employee.employee_status,
          },
        };
      });
    } catch (error) {
      // Giữ nguyên các lỗi nghiệp vụ
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Prisma: vi phạm unique constraint
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Thông tin tài khoản hoặc mã nhân viên đã tồn tại.',
        );
      }

      throw new InternalServerErrorException(
        'Không thể tạo nhân viên.',
      );
    }
  }
}