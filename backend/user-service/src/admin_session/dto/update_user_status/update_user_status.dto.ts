import { IsIn, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsString({ message: 'ID tài khoản phải là chuỗi ký tự.' })
  targetUserId: string;

  @IsString({ message: 'Trạng thái tài khoản phải là chuỗi ký tự.' })
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'], {message: 'Trạng thái chỉ được phép là ACTIVE, INACTIVE hoặc BLOCKED.'})
  status: string;
}