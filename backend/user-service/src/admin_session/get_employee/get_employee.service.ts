import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { GetEmployeeListDto } from '../dto/get_employee_list/get_employee_list.dto';

@Injectable()
export class GetEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeList(userId: string, filters: GetEmployeeListDto) {
    // Check permission
    const hasPermission = await this.prisma.role_Permissions.findFirst({
      where: {
        role: {
          User_Roles: {
            some: {
              user_id: BigInt(userId),
            },
          },
        },
        permission: {
          permission_name: 'employee-list:read',
        },
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'Bạn không có quyền đọc danh sách nhân viên!',
      );
    }

    try {
      const { search, role, gender, status } = filters;
      const keyword = search?.trim();

      const employees = await this.prisma.employees.findMany({
        where: {
          ...(status ? { employee_status: status } : {}),

          ...(gender ? { employee_gender: gender } : {}),

          ...(role
            ? {
                user: {
                  User_Roles: {
                    some: {
                      role: {
                        role_name: role,
                      },
                    },
                  },
                },
              }
            : {}),

          ...(keyword
            ? {
                OR: [
                  {
                    employee_code: {
                      contains: keyword,
                      mode: 'insensitive',
                    },
                  },
                  {
                    employee_full_name: {
                      contains: keyword,
                      mode: 'insensitive',
                    },
                  },
                  {
                    user: {
                      OR: [
                        {
                          user_name: {
                            contains: keyword,
                            mode: 'insensitive',
                          },
                        },
                        {
                          user_email: {
                            contains: keyword,
                            mode: 'insensitive',
                          },
                        },
                        {
                          user_phone: {
                            contains: keyword,
                          },
                        },
                      ],
                    },
                  },
                ],
              }
            : {}),
        },

        select: {
          employee_id: true,
          employee_code: true,
          employee_full_name: true,
          employee_gender: true,
          employee_date_of_birth: true,
          employee_address: true,
          employee_status: true,
          employee_created_at: true,
          employee_updated_at: true,

          user: {
            select: {
              user_id: true,
              user_name: true,
              user_email: true,
              user_phone: true,
              user_status: true,
              User_Roles: {
                select: {
                  role: {
                    select: {
                      role_name: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          employee_created_at: 'desc',
        },
      });

      return employees.map((employee) => ({
        employee_id: employee.employee_id.toString(),
        employee_code: employee.employee_code,
        employee_full_name: employee.employee_full_name,
        employee_gender: employee.employee_gender,
        employee_date_of_birth: employee.employee_date_of_birth,
        employee_address: employee.employee_address,
        employee_status: employee.employee_status,
        employee_created_at: employee.employee_created_at,
        employee_updated_at: employee.employee_updated_at,

        user: {
          user_id: employee.user.user_id.toString(),
          user_name: employee.user.user_name,
          user_email: employee.user.user_email,
          user_phone: employee.user.user_phone,
          user_status: employee.user.user_status,
          roles: employee.user.User_Roles.map(
            (item) => item.role.role_name,
          ),
        },
      }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể lấy danh sách nhân viên.',
      );
    }
  }
}