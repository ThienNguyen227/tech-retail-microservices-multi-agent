import { Body, Controller, Post, Query, Get, Patch, Delete } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";

@Controller('api/v1')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // 1. Tạo Customer từ Register (User Service)
  @Post('/internal/customer')
  createCustomer(@Body() body: Record<string, unknown>) {
    return this.customerService.createForUser(body.customer_user_id);
  }

  // 2. Lấy thông tin của khách hàng
  @Get('/customer')
  getCustomer(@Query('userId') userId: string) {
    return this.customerService.getCustomerByUserId(userId);
  }

  // 3. Cập nhật thông tin khách hàng
  @Patch('/customer')
  updateCustomer(
    @Query('userId') userId: string,
    @Body()
    body: {
      customer_full_name?: string | null;
      customer_date_of_birth?: string | null;
      customer_gender?: string | null;
    },
  ) {
    return this.customerService.updateCustomerByUserId(userId, body);
  }

  // 4. Xóa địa chỉ
  @Delete("/customer/address")
  deleteCustomerAddress(@Query("addressId") addressId: string) {
    return this.customerService.deleteCustomerAddress(addressId);
  }

  // 5. Cập nhật địa chỉ
  @Patch('/customer/address')
  updateCustomerAddress(
    @Query('addressId') addressId: string,
    @Body()
    body: {
      customer_address_line?: string;
      customer_address_ward?: string | null;
      customer_address_province?: string | null;
      customer_address_default?: boolean;
    },
  ) {
    return this.customerService.updateCustomerAddress(addressId, body);
  }

  // 6. Thêm địa chỉ
  @Post("/customer/address")
  createCustomerAddress(
    @Query("customerId") customerId: string,
    @Body() data: CreateCustomerAddressDto,
  ) {
    return this.customerService.createCustomerAddress(
      customerId,
      data,
    );
  }
}
