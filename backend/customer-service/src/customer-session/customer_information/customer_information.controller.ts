import { Body, Controller, Post, Query, Get, Patch, Delete, Req, UseGuards } from '@nestjs/common';

import { CustomerInformationService } from './customer_information.service';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";

@Controller('api/v1/customer-session/customer-service')
export class CustomerInformationController {
  constructor(private readonly customerInformationService: CustomerInformationService) {}

  // 1. (GET) CUSTOMER-INFORMATION
  @UseGuards(JwtAuthGuard)
  @Get("customer-information")
  getCustomerInformation(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.customerInformationService.getCustomerInformation(userId);
  }
}
