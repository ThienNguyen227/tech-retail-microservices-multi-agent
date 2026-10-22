import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import { UpdateUserStatusService } from './update_user_status.service';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";
import { UpdateUserStatusDto } from '../dto/update_user_status/update_user_status.dto';

@Controller('api/v1/admin-session/user-service')
export class UpdateUserStatusController {
    constructor(private readonly updateUserStatusService: UpdateUserStatusService) {}

    @UseGuards(JwtAuthGuard)
    @Patch("status")
    updateUserStatus(@Req() req: { user: JwtPayload },  @Body() dto: UpdateUserStatusDto,) {
        const userId = req.user.sub as string;
        return this.updateUserStatusService.updateUserStatus(userId, dto);
    }
}