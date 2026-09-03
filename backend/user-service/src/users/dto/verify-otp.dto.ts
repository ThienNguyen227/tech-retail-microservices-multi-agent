import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MinLength(6)
  otp_code: string;

  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @IsNotEmpty()
  user_phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  user_password_hash: string;
}
