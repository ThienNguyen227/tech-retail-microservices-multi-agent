import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { CreatePaymentService } from './create_payment.service';
import { CreatePaymentDto } from '../../dto/create_payment.dto';

@Controller('api/v1/payment')
export class CreatePaymentController {
  constructor(private readonly createPaymentService: CreatePaymentService) {}

  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.createPaymentService.createPayment(createPaymentDto);
  }
}