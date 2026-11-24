import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { BranchAddressService } from './branch_address.service';

@Controller('api/v1/ai-session/branch-service/branch-address')
export class BranchAddressController {
  constructor(
    private readonly branchAddressService: BranchAddressService,
  ) {}

  // 1. (GET) BRANCH-ADDRESS BY ID
  @Get(':branchId')
  findAddressByBranchId(
    @Param('branchId') branchId: string,
  ) {
    return this.branchAddressService.findAddressByBranchId(
      branchId,
    );
  }
}