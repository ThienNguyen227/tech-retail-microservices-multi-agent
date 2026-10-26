import {
  IsNotEmpty,
  IsString,
  MinLength,
} from "class-validator";

export class ChangePasswordForgotPasswordDto {
  @IsString({ message: "Mật khẩu mới phải là chuỗi ký tự!" })
  @IsNotEmpty({ message: "Vui lòng nhập mật khẩu mới!" })
  @MinLength(8, {
    message: "Mật khẩu mới phải có ít nhất 8 ký tự!",
  })
  new_password: string;

  @IsString({ message: "User ID phải là chuỗi ký tự!" })
  @IsNotEmpty({ message: "User ID không được để trống!" })
  user_id: string;
}