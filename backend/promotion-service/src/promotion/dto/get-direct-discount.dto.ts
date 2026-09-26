import { IsNotEmpty, IsString } from 'class-validator';

export class GetDirectDiscountDto {
  @IsString()
  @IsNotEmpty()
  sku: string;
}