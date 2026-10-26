
import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { SearchUserService } from './search_user.service';

@Controller('api/v1/ai/user-service')
export class SearchUserController {
  constructor(
    private readonly searchUserService: SearchUserService,
  ) {}

  @Get('search')
  searchUser(
    @Query('phone') phone?: string,
    @Query('email') email?: string,
  ) {
    return this.searchUserService.searchUser({
      phone,
      email,
    });
  }
}
