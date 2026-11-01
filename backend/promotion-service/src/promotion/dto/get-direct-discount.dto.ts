import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class GetDirectDiscountDto {
  @IsString()
  @IsNotEmpty()
  sku: string;
}

export class GetDirectDiscountsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  skus: string[];
}