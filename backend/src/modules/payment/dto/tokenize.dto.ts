import { IsNotEmpty, IsString } from 'class-validator';

export class TokenizeDto {
  @IsNotEmpty({ message: 'order_id wajib diisi' })
  @IsString()
  order_id: string;
}
