import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

const VALID_ROLES = ['customer', 'vendor', 'designer', 'courier', 'sales', 'factory', 'creator'];

export class RegisterDto {
  @IsEmail({}, { message: 'Зөв имэйл хаяг оруулна уу' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Нууц үг хамгийн багадаа 8 тэмдэгт' })
  password: string;

  @IsString({ message: 'Бүтэн нэр оруулна уу' })
  full_name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(VALID_ROLES, { message: 'Зөвшөөрөгдсөн role: ' + VALID_ROLES.join(', ') })
  role?: string;

  // ─── Shared business fields ───
  @IsOptional() @IsString()
  company_name?: string;

  @IsOptional() @IsString()
  register_number?: string;

  @IsOptional() @IsString()
  tax_id?: string;

  @IsOptional() @IsString()
  bank_name?: string;

  @IsOptional() @IsString()
  bank_account?: string;

  @IsOptional() @IsString()
  bank_account_name?: string;

  @IsOptional() @IsString()
  office_address?: string;

  // ─── Designer fields ───
  @IsOptional() @IsString()
  portfolio_url?: string;

  @IsOptional() @IsString()
  professional_bio?: string;

  @IsOptional()
  skill_certifications?: string[];

  // ─── Courier/Driver fields ───
  @IsOptional() @IsString()
  driver_license_number?: string;

  @IsOptional() @IsString()
  vehicle_plate_number?: string;

  @IsOptional() @IsString()
  vehicle_type?: string;

  @IsOptional() @IsString()
  insurance_details?: string;

  // ─── Sales agent referral (when registering via /register?ref=CODE) ───
  @IsOptional() @IsString()
  referral_code?: string;

  // ─── Device tracking ───
  @IsOptional() @IsString()
  device_id?: string;

  @IsOptional() @IsString()
  device_name?: string;

  @IsOptional() @IsString()
  platform?: string;
}
