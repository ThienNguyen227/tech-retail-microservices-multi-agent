import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email không được để trống!' })
  @IsEmail({}, { message: 'Email không hợp lệ!' })
  user_email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống!' })
  @IsString({ message: 'Mật khẩu phải là chuỗi!' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự!' })
  user_password: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
    device_info?: string;
}

