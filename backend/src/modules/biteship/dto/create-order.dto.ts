import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBiteshipOrderDto {
  @IsNotEmpty({ message: 'orderId wajib diisi' })
  @IsString()
  orderId: string;
}

