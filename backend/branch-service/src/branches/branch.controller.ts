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

@Controller('api/v1/branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  // http://localhost:3005/api/v1/branches?status=ACTIVE
  @Get()
  findAll(@Query('status') status?: BranchStatus) {
    return this.branchService.findAll(status);
  }
}