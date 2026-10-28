import {
  IsDateString,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCustomerListDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  customer_code?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  customer_full_name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString()
  customer_date_of_birth?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  customer_gender?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  customer_status?: string;
}