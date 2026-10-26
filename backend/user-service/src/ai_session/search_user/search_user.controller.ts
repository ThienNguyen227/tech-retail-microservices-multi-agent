import { Body, Controller, Post, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { SearchUserService } from './search_user.service';

@Controller('api/v1/customer-session/user-service')
export class SearchUserController {
    constructor(private readonly searchUserService: SearchUserService) {}

    
}