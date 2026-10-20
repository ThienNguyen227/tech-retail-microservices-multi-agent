import { IsEmail, IsNotEmpty } from 'class-validator';

export class ReSendOtpForgotPasswordDto {
  @IsEmail({}, { message: 'Email không đúng định dạng!' })
  @IsNotEmpty({ message: 'Email không được để trống!' })
  user_email: string;
}