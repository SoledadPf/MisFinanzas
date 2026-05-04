import { IsString, IsNumber, IsEnum, IsOptional, IsInt, Min, Max, IsUUID, IsDateString, ValidateIf } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsEnum(['fixed', 'variable']) type?: 'fixed' | 'variable';
  @IsOptional() @IsInt() @Min(1) @Max(31) dueDay?: number;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() notes?: string;

  @ValidateIf((o) => o.workspaceId !== null && o.workspaceId !== undefined)
  @IsString() 
  workspaceId?: string | null;

  @IsOptional() @IsString() splitType?: string;

  @ValidateIf((o) => o.assignedUserId !== null && o.assignedUserId !== undefined)
  @IsString() 
  assignedUserId?: string | null;
}

