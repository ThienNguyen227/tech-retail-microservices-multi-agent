import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';

import { EmployeeService } from './employee.service';
import { GetEmployeeListDto } from '../dto/get_employee_list/get_employee_list.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/v1/admin-session/user-service')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // 1. EMPLOYEE-LIST IN ADMIN
  @UseGuards(JwtAuthGuard)
  @Get('employee-list')
  getEmployeeList(@Req() req: { user: JwtPayload }, @Query() query: GetEmployeeListDto) {
    const userId = req.user.sub as string;
    return this.employeeService.getEmployeeList(userId, query);
  }

  // 2. 
  @UseGuards(JwtAuthGuard)
  @Get('employee-information')
  getEmployeeInformation(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.employeeService.getEmployeeInformation(userId);
  }

}