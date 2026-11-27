import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { JwtPayload } from 'jsonwebtoken';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SearchCustomerService } from './search_customer.service';

@Controller('api/v1/ai/customer-service')
export class SearchCustomerController {
  constructor(
    private readonly searchCustomerService: SearchCustomerService,
  ) {}

  // 1. (GET) SEARCH CUSTOMER AND ADDRESSES
  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchCustomer(
    @Req() req: { user: JwtPayload },
    @Query('userIds') userIds?: string | string[],
    @Query('customerCodes') customerCodes?: string | string[],
  ) {
    const currentUserId = req.user?.sub;
    const roles = req.user?.roles;

    return this.searchCustomerService.searchCustomer(
      currentUserId,
      roles,
      {
        userIds,
        customerCodes,
      },
    );
  }
}