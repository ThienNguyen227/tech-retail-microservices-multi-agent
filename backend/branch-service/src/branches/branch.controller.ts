import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BranchStatus } from '@prisma/client';
import { BranchService } from './branch.service';

@Controller('api/v1/customer-session/branch-service/branch-list')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  // 1. (GET) BRANCH-LIST
  @Get()
  findAll(@Query('status') status?: BranchStatus) {
    return this.branchService.findAll(status);
  }
}