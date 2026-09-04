import { Body, Controller, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('internal')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('customer')
  createCustomer(@Body() body: Record<string, unknown>) {
    return this.customerService.createForUser(body.customer_user_id);
  }
}
