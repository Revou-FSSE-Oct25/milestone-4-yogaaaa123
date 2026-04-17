import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
