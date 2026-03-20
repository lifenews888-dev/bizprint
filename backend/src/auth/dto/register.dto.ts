import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

const VALID_ROLES = ['customer', 'vendor', 'designer', 'courier', 'sales', 'factory'];

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsIn(VALID_ROLES, { message: 'Зөвшөөрөгдсөн role: ' + VALID_ROLES.join(', ') })
  role?: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsString()
  device_name?: string;

  @IsOptional()
  @IsString()
  platform?: string;
}
