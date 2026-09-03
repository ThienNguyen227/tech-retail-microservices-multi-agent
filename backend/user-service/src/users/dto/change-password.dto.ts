import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  new_password: string;
}