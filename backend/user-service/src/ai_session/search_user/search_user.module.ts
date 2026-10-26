import { Module } from '@nestjs/common';

import { SearchUserController } from './search_user.controller';
import { SearchUserService } from './search_user.service';

@Module({
  imports: [],
  controllers: [SearchUserController],
  providers: [SearchUserService],
  exports: [],
})
export class SearchUserModule {}