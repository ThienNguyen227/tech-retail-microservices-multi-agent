import { IsNotEmpty, IsNumberString } from 'class-validator';
export class GetOrderDto {
  @IsNotEmpty({ message: 'orderId không được để trống' })
  @IsNumberString({}, { message: 'orderId phải là chuỗi chữ số hợp lệ' })
  orderId: string;
}