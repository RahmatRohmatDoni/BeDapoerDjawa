import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TrackingDto {
  @IsNotEmpty({ message: 'Nomor resi valid wajib diisi' })
  @IsString()
  resi: string;

  @IsOptional()
  @IsString()
  courier?: string;
}

