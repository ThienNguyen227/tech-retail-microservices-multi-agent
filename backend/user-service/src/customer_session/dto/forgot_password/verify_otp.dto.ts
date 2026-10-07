import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyOtpForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;

  @IsString()
  @Length(6, 6)
  otp_code: string;
}