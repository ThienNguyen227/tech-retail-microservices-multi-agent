import { Module } from '@nestjs/common';
import { RestoreService } from './restore.service';

@Module({
  imports: [],
  controllers: [],
  providers: [RestoreService],
  exports: [RestoreService],
})
export class RestoreModule {}