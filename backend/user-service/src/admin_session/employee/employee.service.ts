import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { GetEmployeeListDto } from '../dto/get_employee_list/get_employee_list.dto';
import { UpdateEmployeeListDto } from "../dto/employee/update_employee_list.dto"
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

  // 2. (PATCH) EMPLOYEE-LIST FOR ROLE: ADMIN
  async updateEmployeeList(userId: string, employeeId: string, dto: UpdateEmployeeListDto) {
    try {
      // 1. Validate employeeId
      if (!/^\d+$/.test(employeeId) || BigInt(employeeId) <= 0n) {
        throw new BadRequestException(
          'ID nhân viên không hợp lệ.',
        );
      }

      if (Object.keys(dto).length === 0) {
        throw new BadRequestException(
          'Vui lòng cung cấp thông tin cần cập nhật.',
        );
      }

      // 2. Check permission
      const hasPermission =
        await this.prisma.role_Permissions.findFirst({
          where: {
            role: {
              User_Roles: {
                some: {
                  user_id: BigInt(userId),
                },
              },
            },
            permission: {
              permission_name: 'employee-list:update',
            },
          },
          select: {
            role_id: true,
          },
        });

      if (!hasPermission) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật thông tin nhân viên!',
        );
      }

      // 3. Check employee exists
      const employee = await this.prisma.employees.findUnique({
        where: {
          employee_id: BigInt(employeeId),
        },
        select: {
          employee_id: true,
          employee_user_id: true,
        },
      });

      if (!employee) {
        throw new NotFoundException(
          'Không tìm thấy thông tin nhân viên!',
        );
      }

      const {
        employee_code,
        employee_full_name,
        employee_gender,
        employee_date_of_birth,
        employee_address,
        employee_status,
        roles,
      } = dto;

      // 4. Check duplicate employee code
      if (employee_code !== undefined) {
        const existingCode =
          await this.prisma.employees.findFirst({
            where: {
              employee_code,
              employee_id: {
                not: BigInt(employeeId),
              },
            },
            select: {
              employee_id: true,
            },
          });

        if (existingCode) {
          throw new ConflictException(
            'Mã nhân viên đã tồn tại.',
          );
        }
      }

      // 5. Validate all roles
      let roleIds: bigint[] | undefined;

      if (roles !== undefined) {
        const existingRoles = await this.prisma.roles.findMany({
          where: {
            role_name: {
              in: roles,
            },
          },
          select: {
            role_id: true,
            role_name: true,
          },
        });

        const existingRoleNames = new Set(
          existingRoles.map((item) => item.role_name),
        );

        const invalidRoles = roles.filter(
          (role) => !existingRoleNames.has(role),
        );

        if (invalidRoles.length > 0) {
          throw new BadRequestException(
            `Role không tồn tại: ${invalidRoles.join(', ')}`,
          );
        }

        roleIds = existingRoles.map((item) => item.role_id);
      }

      // 6. Update Employees and User_Roles in one transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.employees.update({
          where: {
            employee_id: BigInt(employeeId),
          },
          data: {
            ...(employee_code !== undefined && {
              employee_code: employee_code.trim(),
            }),
            ...(employee_full_name !== undefined && {
              employee_full_name: employee_full_name.trim(),
            }),
            ...(employee_gender !== undefined && {
              employee_gender,
            }),
            ...(employee_date_of_birth !== undefined && {
              employee_date_of_birth: new Date(
                `${employee_date_of_birth.slice(0, 10)}T00:00:00.000Z`,
              ),
            }),
            ...(employee_address !== undefined && {
              employee_address: employee_address.trim(),
            }),
            ...(employee_status !== undefined && {
              employee_status,
            }),
          },
        });

        // Only replace roles when the request contains "roles"
        if (roleIds !== undefined) {
          await tx.user_Roles.deleteMany({
            where: {
              user_id: employee.employee_user_id,
            },
          });

          await tx.user_Roles.createMany({
            data: roleIds.map((roleId) => ({
              user_id: employee.employee_user_id,
              role_id: roleId,
            })),
          });
        }
      });

      // 7. Return updated employee
      const updatedEmployee =
        await this.prisma.employees.findUnique({
          where: {
            employee_id: BigInt(employeeId),
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

      if (!updatedEmployee) {
        throw new NotFoundException(
          'Không tìm thấy nhân viên sau khi cập nhật.',
        );
      }

      return {
        message: 'Cập nhật thông tin nhân viên thành công.',
        data: {
          employee_id: updatedEmployee.employee_id.toString(),
          employee_code: updatedEmployee.employee_code,
          employee_full_name:
            updatedEmployee.employee_full_name,
          employee_gender: updatedEmployee.employee_gender,
          employee_date_of_birth:
            updatedEmployee.employee_date_of_birth,
          employee_address: updatedEmployee.employee_address,
          employee_status: updatedEmployee.employee_status,
          employee_created_at:
            updatedEmployee.employee_created_at,
          employee_updated_at:
            updatedEmployee.employee_updated_at,
          user: {
            user_id: updatedEmployee.user.user_id.toString(),
            roles: updatedEmployee.user.User_Roles.map(
              (item) => item.role.role_name,
            ),
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Mã nhân viên đã tồn tại.',
        );
      }

      throw new InternalServerErrorException(
        'Không thể cập nhật thông tin nhân viên.',
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