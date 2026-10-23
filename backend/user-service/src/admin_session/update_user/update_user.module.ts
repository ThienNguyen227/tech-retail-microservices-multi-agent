import { Module } from '@nestjs/common';
import { UpdateUserController } from './update_user.controller';
import { UpdateUserService } from './update_user.service';

@Module({
  imports: [],
  controllers: [UpdateUserController],
  providers: [UpdateUserService],
  exports: [],
})
export class UpdateUserModule {}