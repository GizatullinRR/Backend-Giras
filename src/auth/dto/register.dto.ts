import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @Length(6, 100, { message: 'Пароль должен содержать от 6 до 100 символов' })
  password: string;

  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString({ message: 'Имя должно быть строкой' })
  @Length(1, 100, { message: 'Имя должно содержать от 1 до 100 символов' })
  name: string;
}