import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';
import { IsNotEmpty, IsString } from 'class-validator';

import { CheckPermissionService } from './check_permission.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

class CheckPermissionDto {
  @IsString({
    message: 'Tên quyền phải là chuỗi ký tự.',
  })
  @IsNotEmpty({
    message: 'Tên quyền không được để trống.',
  })
  permission_name: string;
}

@Controller('api/v1/admin-session/user-service')
export class CheckPermissionController {
  constructor(
    private readonly checkPermissionService: CheckPermissionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('check-permission')
  async checkPermission(
    @Req() req: { user: JwtPayload },
    @Body() body: CheckPermissionDto,
  ) {
    const userId = req.user.sub as string;

    return this.checkPermissionService.checkPermission(
      userId,
      body.permission_name,
    );
  }
}