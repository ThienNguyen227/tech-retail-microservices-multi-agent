import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { DirectDiscountService } from './direct_discount.service';

@Controller('api/v1/promotion')
export class OrderController {
  constructor(private readonly directDiscountService: DirectDiscountService) {}

  
}