import {Controller, Get, Query} from '@nestjs/common';


import { CreatePaymentService } from './create_payment.service';

@Controller('api/v1/payment')
export class CreatePaymentController {
    constructor(private readonly createPaymentService: CreatePaymentService) {}
    
  
}