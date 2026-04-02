import { IsEmail, IsNotEmpty } from 'class-validator'

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Зөв имэйл хаяг оруулна уу' })
  @IsNotEmpty({ message: 'Имэйл хаяг оруулна уу' })
  email: string
}
