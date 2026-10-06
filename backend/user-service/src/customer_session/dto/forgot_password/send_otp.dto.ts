import { IsEmail, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendOtpForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;
}