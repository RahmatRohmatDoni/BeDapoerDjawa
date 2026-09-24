import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class FinalizeOrderDto {
  @IsString()
  customerName!: string;

  @IsString()
  customerPhone!: string;

  @IsString()
  shippingAddress!: string;

  @IsString()
  shippingCity!: string;

  @IsString()
  shippingPostalCode!: string;

  @IsString()
  shippingCourier!: string;

  @IsNumber()
  @Min(0)
  shippingCost!: number;

  @IsString()
  shippingAreaId!: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}
