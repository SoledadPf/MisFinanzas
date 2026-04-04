import { IsString, IsNumber, IsEnum, IsOptional, IsInt, Min, Max, IsUUID, IsDateString } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsUUID()
  categoryId: string;

  @IsEnum(['fixed', 'variable'], { message: 'El tipo debe ser "fixed" o "variable"' })
  type: 'fixed' | 'variable';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
