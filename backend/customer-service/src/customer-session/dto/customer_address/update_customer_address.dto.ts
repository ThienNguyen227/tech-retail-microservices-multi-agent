import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerAddressDto {
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống!' })
  @MaxLength(255, { message: 'Địa chỉ không được vượt quá 255 ký tự!' })
  customer_address_line: string;

  @IsString({ message: 'Phường/xã phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Phường/xã không được để trống!' })
  customer_address_ward: string;

  @IsString({ message: 'Tỉnh/thành phố phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Tỉnh/thành phố không được để trống!' })
  customer_address_province: string;

  @IsBoolean({ message: 'Trạng thái địa chỉ mặc định phải là boolean!' })
  customer_address_default: boolean;
}