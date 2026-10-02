import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsNotEmpty({ message: 'SKU không được để trống' })
  @IsString()
  sku: string;

  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Type(() => Number)
  quantity: number;

  @IsNotEmpty({ message: 'Đơn giá không được để trống' })
  @IsNumber({}, { message: 'Đơn giá phải là số' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subtotal?: number;

  @IsOptional()
  @IsString()
  serialNumber?: string;
}

export class CreateOrderDto {
  @IsNotEmpty({ message: 'userId không được để trống' })
  userId: number | string;

  @IsOptional()
  @IsString()
  fulfillmentType?: string; // 'HOME_DELIVERY' | 'STORE_PICKUP'

  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString()
  recipientName: string;

  @IsNotEmpty({ message: 'Số điện thoại người nhận không được để trống' })
  @IsString()
  recipientPhone: string;

  @IsNotEmpty({ message: 'Địa chỉ nhận hàng không được để trống' })
  @IsString()
  addressLine: string;

  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString()
  ward: string;

  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString()
  province: string;

  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shippingFee?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  paymentMethodId?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  deliveryMethodId?: number;
}
