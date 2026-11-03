import {Controller, Get, Query} from '@nestjs/common';
import { CouponService } from './coupon.service';

@Controller('api/v1/customer-session/promotion-service')
export class CouponController {
    constructor(private readonly couponService: CouponService) {}
    
    // 1. (GET) COUPON LIST
    @Get('coupons')
    getAllCoupons() {
        return this.couponService.getAllCoupons();
    }
  
}