import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: '12345678', description: 'Rekening asal' })
  @IsString()
  @IsNotEmpty()
  fromAccountNumber: string;

  @ApiProperty({ example: '87654321', description: 'Rekening tujuan' })
  @IsString()
  @IsNotEmpty()
  toAccountNumber: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(1)
  amount: number;
}
