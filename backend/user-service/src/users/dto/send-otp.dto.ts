import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  user_email: string;
}
