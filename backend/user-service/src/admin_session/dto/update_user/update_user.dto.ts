import {
  IsArray,
  IsEmail,
  IsIn,
  IsString,
  ArrayNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString({ message: 'ID tài khoản phải là chuỗi ký tự.' })
  targetUserId: string;

  @IsString({ message: 'Tên tài khoản phải là chuỗi ký tự.' })
  @MinLength(1, { message: 'Tên tài khoản không được để trống.' })
  @MaxLength(50, { message: 'Tên tài khoản không được vượt quá 50 ký tự.' })
  user_name: string;

  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @MaxLength(255, { message: 'Email không được vượt quá 255 ký tự.' })
  user_email: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự.' })
  @MinLength(1, { message: 'Số điện thoại không được để trống.' })
  @MaxLength(20, { message: 'Số điện thoại không được vượt quá 20 ký tự.' })
  user_phone: string;

  @IsArray({ message: 'Danh sách vai trò phải là một mảng.' })
  @ArrayNotEmpty({ message: 'Tài khoản phải có ít nhất một vai trò.' })
  @IsIn(['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'], {
    each: true,
    message: 'Vai trò không hợp lệ.',
  })
  roles: string[];
}