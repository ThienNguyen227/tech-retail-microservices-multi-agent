import { Module } from '@nestjs/common';

import { CheckPermissionController } from './check_permission.controller';
import { CheckPermissionService } from './check_permission.service';

@Module({
  imports: [],
  controllers: [CheckPermissionController],
  providers: [CheckPermissionService],
  exports: [CheckPermissionService],
})
export class CheckPermissionModule {}