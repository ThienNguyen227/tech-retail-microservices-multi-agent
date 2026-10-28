import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetCustomerListDto {
  @IsOptional()
  @IsString({message: 'Từ khóa tìm kiếm phải là chuỗi ký tự.'})
  search?: string;

  @IsOptional()
  @IsString({message: 'Trạng thái khách hàng phải là chuỗi ký tự.'})
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'], {message: 'Trạng thái chỉ được phép là ACTIVE, INACTIVE hoặc BLOCKED.'})
  status?: string;
}