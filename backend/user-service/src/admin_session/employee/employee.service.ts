import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { GetEmployeeListDto } from '../dto/get_employee_list/get_employee_list.dto';
import { UpdateEmployeeInformationDto } from "../dto/employee/update_employee_information.dto"

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (GET) EMPLOYEE-LIST FOR ROLE: ADMIN
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

  // 2. (GET) EMPLOYEE-INFORMATION FOR ROLE: EMPLOYEE, MANAGER
  async getEmployeeInformation(userId: string) {
    // 1. Check permission
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
          permission_name: "employee-information:read",
        },
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        "Bạn không có quyền đọc thông tin nhân viên!",
      );
    }

    // 2. Get employee information and roles
    const employee = await this.prisma.employees.findUnique({
      where: {
        employee_user_id: BigInt(userId),
      },
      select: {
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
    });

    if (!employee) {
      throw new NotFoundException(
        "Không tìm thấy thông tin nhân viên!",
      );
    }

    // 3. Return employee information with role names
    const { user, ...employeeInfo } = employee;

    return {
      ...employeeInfo,
      roles: user.User_Roles.map((userRole) => userRole.role.role_name),
    };
  }

  // 3. (PATCH) EMPLOYEE-INFORMATION FOR ROLE: EMPLOYEE, MANAGER
  async updateEmployeeInformation(userId: string, dto: UpdateEmployeeInformationDto) {
    // 1. Check permission
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
          permission_name: 'employee-information:update',
        },
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin nhân viên!',
      );
    }

    try {
      // 2. Check whether any field was provided
      const data: {
        employee_full_name?: string;
        employee_gender?: string;
        employee_date_of_birth?: Date;
        employee_address?: string;
      } = {};

      if (dto.employee_full_name !== undefined) {
        data.employee_full_name = dto.employee_full_name;
      }

      if (dto.employee_gender !== undefined) {
        data.employee_gender = dto.employee_gender;
      }

      if (dto.employee_date_of_birth !== undefined) {
        data.employee_date_of_birth = new Date(
          `${dto.employee_date_of_birth}T00:00:00.000Z`,
        );
      }

      if (dto.employee_address !== undefined) {
        data.employee_address = dto.employee_address;
      }

      if (Object.keys(data).length === 0) {
        throw new BadRequestException(
          'Vui lòng cung cấp ít nhất một thông tin cần cập nhật!',
        );
      }

      // 3. Check employee existence
      const employee = await this.prisma.employees.findUnique({
        where: {
          employee_user_id: BigInt(userId),
        },
        select: {
          employee_id: true,
        },
      });

      if (!employee) {
        throw new NotFoundException(
          'Không tìm thấy thông tin nhân viên!',
        );
      }

      // 4. Update employee information
      const updatedEmployee = await this.prisma.employees.update({
        where: {
          employee_user_id: BigInt(userId),
        },
        data,
        select: {
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
      });

      // 5. Return updated employee information
      const { user, ...employeeInfo } = updatedEmployee;

      return {
        ...employeeInfo,
        roles: user.User_Roles.map(
          (userRole) => userRole.role.role_name,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể cập nhật thông tin nhân viên.',
      );
    }
  }
}