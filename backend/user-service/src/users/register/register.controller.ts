import { Controller } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { SendOtpDto } from '../dto/send-otp.dto';
import { RegisterService } from './register.service';

@Controller('auth')
export class RegisterController {
    constructor(private readonly RegisterService: RegisterService) {}

    @Post('customer/register/send-otp')
    sendOtp(@Body() dto: SendOtpDto) {
        return this.RegisterService.sendOtp(dto);
    }

}