import { Body, Controller, Post } from '@nestjs/common';
import { MomoIpnService } from './momo_ipn.service';

@Controller('api/v1/payment/momo')
export class MomoIpnController {
  constructor(private readonly momoIpnService: MomoIpnService) {}

  @Post('ipn')
  async handleIpn(@Body() data: any) {
    return this.momoIpnService.handleIpn(data);
  }
}