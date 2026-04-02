import { IsNotEmpty, MinLength, IsString } from 'class-validator'

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token шаардлагатай' })
  token: string

  @IsString()
  @MinLength(8, { message: 'Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой' })
  @IsNotEmpty({ message: 'Шинэ нууц үг оруулна уу' })
  password: string
}
