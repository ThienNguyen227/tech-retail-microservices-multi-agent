import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RestoreService } from './restore.service';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [RestoreService],
  exports: [RestoreService],
})
export class RestoreModule {}