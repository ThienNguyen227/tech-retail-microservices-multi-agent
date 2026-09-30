import { Controller, Get, Query } from '@nestjs/common';
import { GetOrderListService } from './get_order_list.service';
import { GetOrderListDto } from '../dto/get_order_list/get_order_list.dto';

@Controller('api/v1/order')
export class GetOrderListController {
  constructor(private readonly getOrderListService: GetOrderListService) {}

  @Get()
  getOrderList(@Query() dto: GetOrderListDto) {
    return this.getOrderListService.getOrderList(dto);
  }
}



// http://localhost:3007/api/v1/order?userId=19