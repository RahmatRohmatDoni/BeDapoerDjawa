import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class RatesDto {
  @IsNotEmpty({ message: 'Tujuan tidak valid' })
  @IsString()
  destination: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  itemValue?: number;
}

