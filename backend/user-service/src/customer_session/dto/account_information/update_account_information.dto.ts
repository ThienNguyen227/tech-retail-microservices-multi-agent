import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateAccountInformationDto {
  @IsOptional()
  @IsString({ message: "Tên tài khoản phải là chuỗi ký tự." })
  @Transform(({ value }) => value?.trim())
  @MinLength(1, { message: "Họ và tên không được để trống." })
  @MaxLength(50, {message: "Họ và tên không được vượt quá 50 ký tự."})
  user_name?: string;

  @IsOptional()
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự." })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[0-9]{10,11}$/, {message: "Số điện thoại phải có từ 10 đến 11 chữ số!"})
  @MaxLength(20, {message: "Số điện thoại không được vượt quá 20 ký tự."})
  user_phone?: string;
}