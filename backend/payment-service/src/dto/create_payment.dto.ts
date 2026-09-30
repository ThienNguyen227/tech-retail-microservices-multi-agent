import { IsInt, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  order_id: number;

  @IsInt()
  @IsPositive()
  payment_method_id: number;
}