import { Controller, Get, Req, UseGuards, Query, Body, Patch } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';

import { EmployeeService } from './employee.service';
import { GetEmployeeListDto } from '../dto/get_employee_list/get_employee_list.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { UpdateEmployeeInformationDto } from "../dto/employee/update_employee_information.dto"

@Controller('api/v1/admin-session/user-service')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // 1. (GET) EMPLOYEE-LIST FOR ROLE: ADMIN
  @UseGuards(JwtAuthGuard)
  @Get('employee-list')
  getEmployeeList(@Req() req: { user: JwtPayload }, @Query() query: GetEmployeeListDto) {
    const userId = req.user.sub as string;
    return this.employeeService.getEmployeeList(userId, query);
  }

  // 2. (GET) EMPLOYEE-INFORMATION FOR ROLE: EMPLOYEE, MANAGER
  @UseGuards(JwtAuthGuard)
  @Get('employee-information')
  getEmployeeInformation(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.employeeService.getEmployeeInformation(userId);
  }

  // 3. (PATCH) EMPLOYEE-INFORMATION FOR ROLE: EMPLOYEE, MANAGER
  @UseGuards(JwtAuthGuard)
  @Patch('employee-information')
  updateEmployeeInformation(@Req() req: { user: JwtPayload }, @Body() updateEmployeeInformationDto: UpdateEmployeeInformationDto) {
    const userId = req.user.sub as string;
    return this.employeeService.updateEmployeeInformation(userId, updateEmployeeInformationDto);
  }
}