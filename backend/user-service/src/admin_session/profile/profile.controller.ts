import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProfileService } from './profile.service';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";


@Controller('api/v1/admin-session/user-service')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.profileService.getProfile(userId);
  }
}