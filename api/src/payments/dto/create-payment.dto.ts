import { IsUUID, IsInt, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  expenseId: string;

  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountPaid: number;
}
