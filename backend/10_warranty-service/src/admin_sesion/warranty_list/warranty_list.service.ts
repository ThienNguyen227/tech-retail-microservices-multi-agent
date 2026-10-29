import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarrantyListService {
  constructor(private readonly prisma: PrismaService) {}

  
}