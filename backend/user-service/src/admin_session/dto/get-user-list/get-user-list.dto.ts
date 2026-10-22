import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetUserListDto {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Vai trò phải là chuỗi ký tự.' })
  @IsIn(['ADMIN', 'EMPLOYEE', 'MANAGER', 'CUSTOMER'], {message: 'Vai trò chỉ được phép là ADMIN, EMPLOYEE, MANAGER hoặc CUSTOMER.'})
  role?: string;

  @IsOptional()
  @IsString({ message: 'Trạng thái tài khoản phải là chuỗi ký tự.' })
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'], {message: 'Trạng thái chỉ được phép là ACTIVE, INACTIVE hoặc BLOCKED.'})
  status?: string;
}