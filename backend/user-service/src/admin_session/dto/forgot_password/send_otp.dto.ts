import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendOtpForgotPasswordDto {
  @IsEmail({}, { message: 'Email không đúng định dạng!' })
  @IsNotEmpty({ message: 'Email không được để trống!' })
  user_email: string;
}