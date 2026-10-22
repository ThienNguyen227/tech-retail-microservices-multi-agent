import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString({ message: 'Tên tài khoản phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Tên tài khoản không được để trống.' })
  @MaxLength(50, { message: 'Tên tài khoản không được vượt quá 50 ký tự.' })
  user_name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  @MaxLength(255, { message: 'Email không được vượt quá 255 ký tự.' })
  user_email: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống.' })
  @MaxLength(20, { message: 'Số điện thoại không được vượt quá 20 ký tự.' })
  user_phone: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  user_password: string;

  @IsString({ message: 'Trạng thái tài khoản không hợp lệ.' })
  @IsNotEmpty({ message: 'Trạng thái tài khoản không được để trống.' })
  user_status: string;

  @IsString({ message: 'Vai trò không hợp lệ.' })
  @IsNotEmpty({ message: 'Vai trò không được để trống.' })
  role_name: string;

  @IsString({ message: 'Họ và tên phải là chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự.' })
  employee_full_name: string;

  @IsString({ message: 'Giới tính không hợp lệ.' })
  @IsNotEmpty({ message: 'Giới tính không được để trống.' })
  employee_gender: string;

  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng.' })
  @IsNotEmpty({ message: 'Ngày sinh không được để trống.' })
  employee_date_of_birth: string;

  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự.' })
  employee_address: string;

  @IsString({ message: 'Trạng thái nhân viên không hợp lệ.' })
  @IsNotEmpty({ message: 'Trạng thái nhân viên không được để trống.' })
  employee_status: string;
}