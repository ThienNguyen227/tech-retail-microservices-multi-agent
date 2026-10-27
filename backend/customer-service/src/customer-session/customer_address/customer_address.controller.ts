import { Body, Controller, Post, Query, Get, Patch, Delete, Req, UseGuards, Param } from '@nestjs/common';

import { CustomerAddressService } from './customer_address.service';
import { CreateCustomerAddressDto } from '../dto/customer_address/create_customer_address.dto';
import { UpdateCustomerAddressDto } from '../dto/customer_address/update_customer_address.dto';

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";

@Controller('api/v1/customer-session/customer-service')
export class CustomerAddressController {
  constructor(private readonly customerAddressService: CustomerAddressService) {}

  // 3. (POST) CUSTOMER-ADDRESS
  @UseGuards(JwtAuthGuard)
  @Post('customer-address')
  createCustomerAddress(@Req() req: { user: JwtPayload }, @Body() payload: CreateCustomerAddressDto) {
    const userId = req.user.sub as string;

    return this.customerAddressService.createCustomerAddress(
      userId,
      payload,
    );
  }

  // 4. (PATCH) CUSTOMER-ADDRESS
  @UseGuards(JwtAuthGuard)
  @Patch('customer-address/:addressId')
  updateCustomerAddress(@Req() req: { user: JwtPayload }, @Param('addressId') addressId: string, @Body() payload: UpdateCustomerAddressDto) {
    const userId = req.user.sub as string;

    return this.customerAddressService.updateCustomerAddress(
      userId,
      addressId,
      payload,
    );
  }

  // 5. (DELETE) CUSTOMER-ADDRESS
  @UseGuards(JwtAuthGuard)
  @Delete('customer-address/:addressId')
  deleteCustomerAddress(@Req() req: { user: JwtPayload }, @Param('addressId') addressId: string) {
    const userId = req.user.sub as string;

    return this.customerAddressService.deleteCustomerAddress(
      userId,
      addressId,
    );
  }
  
}
