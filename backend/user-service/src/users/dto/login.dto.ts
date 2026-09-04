import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  user_email: string;

  @IsString()
  @MinLength(6)
  user_password: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  device_info?: string;
}