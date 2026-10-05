import { Controller } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Post } from '@nestjs/common';

import { SendOtpDto } from '../dto/register/send_otp.dto';
import { RegisterService } from './register.service';

@Controller('api/v1/user-service')
export class RegisterController {
    constructor(private readonly RegisterService: RegisterService) {}

    @Post('register/otp-sending')
    sendOtp(@Body() dto: SendOtpDto) {
        return this.RegisterService.sendOtp(dto);
    }


}