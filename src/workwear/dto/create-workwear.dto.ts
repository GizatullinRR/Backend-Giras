import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';
import { WorkwearSize } from '../enums/size.enum';
import { WorkwearSeason } from '../enums/season.enum';
import { WorkwearItemSet } from '../enums/set.enum';
import { WorkwearCategory } from '../enums/category.enum';
import { Transform, Type } from 'class-transformer';

export class CreateWorkwearDto {
  @IsNotEmpty({ message: 'Название обязательно для заполнения' })
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(1, { message: 'Название не может быть пустым' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  description: string;

  @IsNotEmpty({ message: 'Категория обязательна для заполнения' })
  @IsEnum(WorkwearCategory, { message: `Категория должна быть одной из: ${Object.values(WorkwearCategory).join(', ')}` })
  category: WorkwearCategory;

  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsNotEmpty({ message: 'Размер обязателен для заполнения' })
  @IsArray({ message: 'Размеры должны быть в массиве' })
  @IsEnum(WorkwearSize, { each: true, message: `Размер должен быть одним из: ${Object.values(WorkwearSize).join(', ')}` })
  size: WorkwearSize[];

  @IsNotEmpty({ message: 'Цвет обязателен для заполнения' })
  @IsString({ message: 'Цвет должен быть строкой' })
  @MinLength(1, { message: 'Цвет не может быть пустым' })
  color: string;

  @IsNotEmpty({ message: 'Сезон обязателен для заполнения' })
  @IsEnum(WorkwearSeason, { message: `Сезон должен быть одним из значений: ${Object.values(WorkwearSeason).join(', ')}` })
  season: WorkwearSeason;

  @IsNotEmpty({ message: 'Комплект обязателен для заполнения' })
  @IsEnum(WorkwearItemSet, { message: `Комплект должен быть одним из значений: ${Object.values(WorkwearItemSet).join(', ')}` })
  set: WorkwearItemSet;

  @IsNotEmpty({ message: 'Цена обязательна для заполнения' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Цена должна быть числом' })
  @Min(0.01, { message: 'Цена должна быть больше 0' })
  price: number;

  @IsNotEmpty({ message: 'Артикул обязателен для заполнения' })
  @IsString({ message: 'Артикул должен быть строкой' })
  @MinLength(1, { message: 'Артикул не может быть пустым' })
  @Matches(/^[\p{L}0-9_-]+$/u, { message: 'Артикул: буквы (в т.ч. кириллица), цифры, дефис и подчёркивание' })
  sku: string;

  @IsNotEmpty({ message: 'Статус сертификации обязателен для заполнения' })
  @IsBoolean({ message: 'Статус сертификации должен быть логическим значением' })
  isCertified: boolean;

  @IsNotEmpty({ message: 'Материал обязателен для заполнения' })
  @IsString({ message: 'Материал должен быть строкой' })
  material: string;
}