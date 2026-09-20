import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class FinalizeOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsString()
  shippingAddress: string;

  @IsString()
  shippingCity: string;

  @IsString()
  shippingPostalCode: string;

  @IsString()
  shippingCourier: string;

  @IsNumber()
  @Min(0)
  shippingCost: number;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsOptional()
  @IsNumber()
  totalWeight?: number;

  @IsOptional()
  @IsNumber()
  totalLength?: number;

  @IsOptional()
  @IsNumber()
  totalWidth?: number;

  @IsOptional()
  @IsNumber()
  totalHeight?: number;
}

