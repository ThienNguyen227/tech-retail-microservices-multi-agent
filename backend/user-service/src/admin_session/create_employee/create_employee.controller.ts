import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';

import { CreateEmloyeeService } from './create_employee.service';
import { CreateEmployeeDto } from '../dto/create_employee/create_employee.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/v1/admin-session/user-service')
export class CreateEmloyeeController {
  constructor(
    private readonly createEmloyeeService: CreateEmloyeeService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('employee')
  createEmployee(@Req() req: { user: JwtPayload }, @Body() dto: CreateEmployeeDto) {
    const userId = req.user.sub as string;

    return this.createEmloyeeService.createEmployee(userId, dto);
  }
}