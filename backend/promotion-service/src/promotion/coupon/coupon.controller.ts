import {Controller, Get, Query} from '@nestjs/common';


import { CouponService } from './coupon.service';

@Controller('api/v1/promotion')
export class CouponController {
    constructor(private readonly couponService: CouponService) {}
    
    @Get('coupons')
    getAllCoupons() {
        return this.couponService.getAllCoupons();
    }
  
}