import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { GetCustomerAddressesService } from './get_customer_addresses.service';

@Controller('api/v1/ai/customer-service/addresses')
export class GetCustomerAddressesController {
  // Khởi tạo controller cho API của tool get_customer_addresses.
  constructor(
    private readonly getCustomerAddressesService:
      GetCustomerAddressesService,
  ) {}

  // Tra cứu danh sách địa chỉ theo userId hoặc customerCode.
  @Get()
  getCustomerAddresses(
    @Query('userId') userId?: string,
    @Query('customerCode') customerCode?: string,
  ) {
    return this.getCustomerAddressesService.getCustomerAddresses({
      userId,
      customerCode,
    });
  }
}
