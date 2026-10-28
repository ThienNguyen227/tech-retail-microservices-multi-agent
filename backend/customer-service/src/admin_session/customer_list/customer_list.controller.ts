import {
  Controller,
  Get,
  Query,
  Req,
  Headers,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtPayload } from 'jsonwebtoken';

import { CustomerListService } from './customer_list.service';
import { GetCustomerListDto } from '../dto/get_customer_list/get_customer_list.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/v1/admin-session/customer-service')
export class CustomerListController {
  constructor(
    private readonly customerListService: CustomerListService,
  ) {}

  // @UseGuards(JwtAuthGuard)
  // @Get('customer-list')
  // getCustomerList(
  //   @Req() req: { user: JwtPayload },
  //   @Headers('authorization') authorization: string,
  //   @Query() query: GetCustomerListDto,
  // ) {
  //   const userId = req.user.sub as string;

  //   const accessToken = authorization?.replace(/^Bearer\s+/i, '');

  //   if (!accessToken) {
  //     throw new ForbiddenException('Thiếu access token.');
  //   }

  //   return this.customerListService.getCustomerList(
  //     userId,
  //     query,
  //     accessToken,
  //   );
  // }
  @UseGuards(JwtAuthGuard)
  @Get('customer-list')
  getCustomerList(
    @Headers('authorization') authorization: string,
    @Query() query: GetCustomerListDto,
  ) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      throw new UnauthorizedException('Thiếu access token.');
    }

    return this.customerListService.getCustomerList(
      query,
      accessToken,
    );
  }
}