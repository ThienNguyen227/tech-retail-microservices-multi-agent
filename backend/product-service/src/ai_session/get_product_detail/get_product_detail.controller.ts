
import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetProductDetailService } from './get_product_detail.service';

@Controller('api/v1/ai/product-service')
export class GetProductDetailController {
  constructor(
    private readonly getProductDetailService: GetProductDetailService,
  ) {}

  // Tìm theo slug hoặc tên sản phẩm
  // Ví dụ:
  // GET http://localhost:3003/api/v1/ai/product-service/details?keyword=iPhone%2017%20Pro%20Max

  @Get('details')
  async getByKeyword(@Query('keyword') keyword: string) {
    return this.getProductDetailService.getProductDetailsByKeyword(keyword);
  }
}
