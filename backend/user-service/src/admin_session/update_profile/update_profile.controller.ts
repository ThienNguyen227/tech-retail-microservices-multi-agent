import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { UpdateProfileService } from './update_profile.service';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";
import { UpdateProfileDto } from "../dto/update_profile/update_profile.dto"


@Controller('api/v1/admin-session/user-service')
export class UpdateProfileController {
  constructor(private readonly updateProfileService: UpdateProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  updateProfile(@Req() req: { user: JwtPayload }, @Body() dto: UpdateProfileDto,) {
    const userId = req.user.sub as string;
    return this.updateProfileService.updateProfile(userId, dto);
  }
}