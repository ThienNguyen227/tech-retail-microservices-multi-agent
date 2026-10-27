import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerInformationDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự!' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự!' })
  customer_full_name?: string;

  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'Ngày sinh không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD!' },
  )
  customer_date_of_birth?: string;

  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi ký tự!' })
  @IsIn(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Giới tính không hợp lệ!',
  })
  customer_gender?: string;
}