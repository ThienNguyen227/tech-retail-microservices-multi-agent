import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpForgotPasswordDto {
  @IsEmail({}, { message: 'Email không đúng định dạng!' })
  @IsNotEmpty({ message: 'Email không được để trống!' })
  user_email: string;

  @IsString({ message: 'Mã OTP phải là chuỗi ký tự!' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 ký tự!' })
  otp_code: string;
}