import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class GenerateAprioriDto {
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(1.0)
  minSupport?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(1.0)
  minConfidence?: number;
}

