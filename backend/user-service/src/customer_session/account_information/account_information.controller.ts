import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AccountInformationService } from './account_information.service';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";
import { UpdateAccountInformationDto } from "../dto/account_information/update_account_information.dto";


@Controller('api/v1/customer-session/user-service')
export class AccountInformationController {
  constructor(private readonly accountInformationService: AccountInformationService) {}

  // 1. (GET) ACCOUNT-INFORMATION
  @UseGuards(JwtAuthGuard)
  @Get("account-information")
  getAccountInformation(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.accountInformationService.getAccountInformation(userId);
  }

  // 2. (PATCH) ACCOUNT-INFORMATION
  @UseGuards(JwtAuthGuard)
  @Patch("account-information")
  updateAccountInformation(@Req() req: { user: JwtPayload }, @Body() dto: UpdateAccountInformationDto) {
    const userId = req.user.sub as string;
    return this.accountInformationService.updateAccountInformation(userId, dto);
  }
}