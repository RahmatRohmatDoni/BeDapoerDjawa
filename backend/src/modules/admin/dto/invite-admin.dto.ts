import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InviteAdminDto {
  @IsEmail({}, { message: 'Email wajib diisi dan valid.' })
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  nama_user?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  no_hp?: string;

  @IsOptional()
  @IsString()
  alamat?: string;
}

