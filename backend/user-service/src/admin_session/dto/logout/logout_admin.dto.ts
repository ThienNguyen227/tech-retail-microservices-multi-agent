import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutAdminDto {
  @IsString({ message: 'Refresh token phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Refresh token không được để trống!' })
  refresh_token: string;
}