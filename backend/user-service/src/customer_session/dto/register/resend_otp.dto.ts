import { IsEmail, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class ReSendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;
}