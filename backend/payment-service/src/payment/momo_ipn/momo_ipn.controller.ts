import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { MomoIpnService } from './momo_ipn.service';

@Controller('api/v1/payment/momo')
export class MomoIpnController {
  constructor(private readonly momoIpnService: MomoIpnService) {}

  @Post('ipn')
  @HttpCode(204)
  async handleIpn(@Body() data: any) {
    return this.momoIpnService.handleIpn(data);
  }
}