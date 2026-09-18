import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateCustomerAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customer_address_line: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customer_address_ward?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customer_address_province?: string | null;

  @IsBoolean()
  customer_address_default: boolean;
}