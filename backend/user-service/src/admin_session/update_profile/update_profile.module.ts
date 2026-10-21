import { Module } from '@nestjs/common';
import { UpdateProfileController } from './update_profile.controller';
import { UpdateProfileService } from './update_profile.service';

@Module({
  imports: [],
  controllers: [UpdateProfileController],
  providers: [UpdateProfileService],
  exports: [],
})
export class UpdateAdminProfileModule {}