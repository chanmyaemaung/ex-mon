import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';

export class GetTransactionsRequestDto {
  @IsDateString() // Validate date format (YYYY-MM-DD)
  @IsOptional()
  date: string;

  @IsInt() // Validate integer
  @IsPositive() // Validate positive number
  @IsOptional()
  which: number;

  @IsInt() // Validate integer
  @IsPositive() // Validate positive number
  @IsOptional()
  count: number;
}
