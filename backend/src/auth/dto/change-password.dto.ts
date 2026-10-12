import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Одоогийн нууц үгээ оруулна уу' })
  currentPassword: string

  @IsString()
  @MinLength(8, { message: 'Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой' })
  // bcrypt нь эхний 72 байтыг л тооцдог
  @MaxLength(72, { message: 'Нууц үг хамгийн ихдээ 72 тэмдэгт байна' })
  @IsNotEmpty({ message: 'Шинэ нууц үг оруулна уу' })
  newPassword: string

  /** Одоогийн сессийн refresh token — үүнийг үлдээгээд бусад сессийг хаана */
  @IsOptional()
  @IsString()
  refresh_token?: string
}
