import { IsEmail, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;

  @IsPhoneNumber('VN')
  @IsNotEmpty()
  user_phone: string;
}