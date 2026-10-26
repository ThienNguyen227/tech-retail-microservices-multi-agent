import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';


import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class SearchUserService {
  constructor(private readonly prisma: PrismaService) {}
  
  
}