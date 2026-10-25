import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AccountInformationService } from './account_information.service';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";


@Controller('api/v1/customer-session/user-service')
export class AccountInformationController {
  constructor(private readonly accountInformationService: AccountInformationService) {}

  @UseGuards(JwtAuthGuard)
  @Get("account-information")
  getAccountInformation(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.accountInformationService.getAccountInformation(userId);
  }
}