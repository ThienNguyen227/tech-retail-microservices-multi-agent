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

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  // GET /branches hoặc /branches?status=ACTIVE
  @Get()
  findAll(@Query('status') status?: BranchStatus) {
    return this.branchService.findAll(status);
  }
}