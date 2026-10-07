import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password: string;
}