import { Module } from '@nestjs/common';
import { RefreshAccessTokenController } from './refresh_access_token.controller';
import { RefreshAccessTokenService } from './refresh_access_token.service';

@Module({
  imports: [],
  controllers: [RefreshAccessTokenController],
  providers: [RefreshAccessTokenService],
  exports: [],
})
export class RefreshAccessTokenModule {}