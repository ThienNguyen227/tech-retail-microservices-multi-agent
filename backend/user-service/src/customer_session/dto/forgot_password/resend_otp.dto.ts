import { IsEmail, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class ReSendOtpForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;
}