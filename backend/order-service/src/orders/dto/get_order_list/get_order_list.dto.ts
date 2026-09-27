import { IsNotEmpty, IsNumberString } from 'class-validator';
export class GetOrderListDto {
  @IsNotEmpty({ message: 'userId không được để trống' })
  @IsNumberString({}, { message: 'userId phải là chuỗi chữ số hợp lệ' })
  userId: string;
}