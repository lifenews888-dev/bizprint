import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  email: string;  // accepts email or phone number

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsString()
  device_name?: string;

  @IsOptional()
  @IsString()
  platform?: string;  // web | ios | android
}