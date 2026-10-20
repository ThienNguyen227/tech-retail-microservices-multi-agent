import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordForgotPasswordDto {
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống!' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' })
  new_password: string;
}