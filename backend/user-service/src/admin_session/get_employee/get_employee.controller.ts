import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';

import { GetEmployeeService } from './get_employee.service';
import { GetEmployeeListDto } from '../dto/get_employee_list/get_employee_list.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/v1/admin-session/user-service')
export class GetEmployeeController {
  constructor(private readonly getEmployeeService: GetEmployeeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('employee-list')
  getEmployeeList(@Req() req: { user: JwtPayload }, @Query() query: GetEmployeeListDto) {
    const userId = req.user.sub as string;
    return this.getEmployeeService.getEmployeeList(userId, query);
  }
}