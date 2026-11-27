import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { JwtPayload } from 'jsonwebtoken';

import { SearchUserService } from './search_user.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/v1/ai/user-service')
export class SearchUserController {
  constructor(
    private readonly searchUserService: SearchUserService,
  ) {}

  // 1. (GET) SEARCH USER
  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchUser(
    @Req() req: { user: JwtPayload },
    @Query('phone') phone?: string,
    @Query('email') email?: string,
  ) {
    const userId = req.user.sub as string;

    return this.searchUserService.searchUser(
      userId,
      {
        phone,
        email,
      },
    );
  }
}