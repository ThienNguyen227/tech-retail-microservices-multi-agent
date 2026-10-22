import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';

import { GetUserListService } from './get_user_list.service';
import { GetUserListDto } from '../dto/get-user-list/get-user-list.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/v1/admin-session/user-service')
export class GetUserListController {
  constructor(private readonly getUserListService: GetUserListService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user-list')
  getUserList(@Req() req: { user: JwtPayload }, @Query() query: GetUserListDto) {
    const userId = req.user.sub as string;
    return this.getUserListService.getUserList(userId, query);
  }
}