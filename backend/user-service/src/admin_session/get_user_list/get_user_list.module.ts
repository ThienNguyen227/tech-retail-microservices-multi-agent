import { Module } from '@nestjs/common';
import { GetUserListController } from './get_user_list.controller';
import { GetUserListService } from './get_user_list.service';

@Module({
  imports: [],
  controllers: [GetUserListController],
  providers: [GetUserListService],
  exports: [],
})
export class GetUserListModule {}