import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(1)
  @MaxLength(50)
  user_name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(/^[0-9+\-\s()]+$/, {
    message: "Số điện thoại không hợp lệ",
  })
  @MaxLength(20)
  user_phone?: string;
}