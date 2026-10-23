import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import { UpdateUserService } from './update_user.service';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";
import { UpdateUserDto } from '../dto/update_user/update_user.dto';

@Controller('api/v1/admin-session/user-service')
export class UpdateUserController {
    constructor(private readonly updateUserService: UpdateUserService) {}

    @UseGuards(JwtAuthGuard)
    @Patch("user")
    updateUser(@Req() req: { user: JwtPayload },  @Body() dto: UpdateUserDto,) {
        const userId = req.user.sub as string;
        return this.updateUserService.updateUser(userId, dto);
    }
}