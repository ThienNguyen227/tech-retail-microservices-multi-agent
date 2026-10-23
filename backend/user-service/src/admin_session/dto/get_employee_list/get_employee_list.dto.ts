import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetEmployeeListDto {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Vai trò phải là chuỗi ký tự.' })
  @IsIn(['ADMIN', 'EMPLOYEE', 'MANAGER', 'CUSTOMER'], {message: 'Vai trò chỉ được phép là ADMIN, EMPLOYEE, MANAGER hoặc CUSTOMER.'})
  role?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Giới tính chỉ được phép là MALE, FEMALE hoặc OTHER.',
  })
  gender?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'], {
    message: 'Trạng thái nhân viên chỉ được phép là ACTIVE, INACTIVE hoặc BLOCKED.',
  })
  status?: string;
}