
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  ArrayNotEmpty,
  ArrayUnique,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateEmployeeListDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/\S/, {
    message: 'Mã nhân viên không được để trống.',
  })
  employee_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/\S/, {
    message: 'Họ tên không được để trống.',
  })
  employee_full_name?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  employee_gender?: string;

  @IsOptional()
  @IsDateString()
  employee_date_of_birth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/\S/, {
    message: 'Địa chỉ không được để trống.',
  })
  employee_address?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  employee_status?: string;

  // Một user có thể có nhiều role
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({
    message: 'Danh sách role không được để trống.',
  })
  @ArrayUnique({
    message: 'Danh sách role không được chứa role trùng lặp.',
  })
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  roles?: string[];
}
