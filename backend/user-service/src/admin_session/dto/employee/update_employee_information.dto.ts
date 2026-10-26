import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateEmployeeInformationDto {
  @IsOptional()
  @IsString({ message: "Họ và tên phải là chuỗi ký tự!" })
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @MinLength(1, { message: "Họ và tên không được để trống!" })
  @MaxLength(100, { message: "Họ và tên không được vượt quá 100 ký tự!" })
  employee_full_name?: string;

  @IsOptional()
  @IsString({ message: "Giới tính phải là chuỗi ký tự!" })
  @IsIn(["MALE", "FEMALE", "OTHER"], {message: "Giới tính chỉ được là MALE, FEMALE hoặc OTHER!"})
  employee_gender?: string;

  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: "Ngày sinh phải hợp lệ theo định dạng YYYY-MM-DD!" },
  )
  employee_date_of_birth?: string;

  @IsOptional()
  @IsString({ message: "Địa chỉ phải là chuỗi ký tự!" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @MinLength(1, { message: "Địa chỉ không được để trống!" })
  @MaxLength(255, { message: "Địa chỉ không được vượt quá 255 ký tự!" })
  employee_address?: string;
}