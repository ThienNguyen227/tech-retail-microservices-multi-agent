import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { SearchCustomerService } from './search_customer.service';

@Controller('api/v1/ai/customer-service')
export class SearchCustomerController {
  constructor(
    private readonly SearchCustomerService: SearchCustomerService,
  ) {}

  // Tra cứu thông tin hồ sơ customer cho tool search_customer.
  @Get('search')
  searchCustomer(
    @Query('userId') userId?: string,
    @Query('customerCode') customerCode?: string,
  ) {
    return this.SearchCustomerService.searchCustomer({
      userId,
      customerCode,
    });
  }
}
