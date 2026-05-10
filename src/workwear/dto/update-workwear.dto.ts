import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';
import { WorkwearSize } from '../enums/size.enum';
import { WorkwearSeason } from '../enums/season.enum';
import { WorkwearItemSet } from '../enums/set.enum';
import { WorkwearCategory } from '../enums/category.enum';
import { Transform, Type } from 'class-transformer';
import { parseBooleanLike } from '../../common/parse-boolean-like';

export class UpdateWorkwearDto {
  @IsOptional()
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(1, { message: 'Название не может быть пустым' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  description?: string;

  @IsOptional()
  @IsEnum(WorkwearCategory, { message: `Категория должна быть одной из: ${Object.values(WorkwearCategory).join(', ')}` })
  category?: WorkwearCategory;

  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsOptional()
  @IsArray({ message: 'Размеры должны быть в массиве' })
  @IsEnum(WorkwearSize, { each: true, message: `Размер должен быть одним из: ${Object.values(WorkwearSize).join(', ')}` })
  size?: WorkwearSize[];

  @IsOptional()
  @IsString({ message: 'Цвет должен быть строкой' })
  @MinLength(1, { message: 'Цвет не может быть пустым' })
  color?: string;

  @IsOptional()
  @IsEnum(WorkwearSeason, { message: `Сезон должен быть одним из значений: ${Object.values(WorkwearSeason).join(', ')}` })
  season?: WorkwearSeason;

  @IsOptional()
  @IsEnum(WorkwearItemSet, { message: `Комплект должен быть одним из значений: ${Object.values(WorkwearItemSet).join(', ')}` })
  set?: WorkwearItemSet;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Цена должна быть числом' })
  @Min(0.01, { message: 'Цена должна быть больше 0' })
  price?: number;

  @IsOptional()
  @IsString({ message: 'Артикул должен быть строкой' })
  @MinLength(1, { message: 'Артикул не может быть пустым' })
  @Matches(/^[\p{L}0-9_-]+$/u, { message: 'Артикул: буквы (в т.ч. кириллица), цифры, дефис и подчёркивание' })
  sku?: string;

  @IsOptional()
  @Transform(({ obj, value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseBooleanLike(obj?.isCertified) ?? parseBooleanLike(value) ?? value;
  })
  @IsBoolean({ message: 'Статус сертификации должен быть логическим значением' })
  isCertified?: boolean;

  @IsOptional()
  @IsString({ message: 'Материал должен быть строкой' })
  @MinLength(1, { message: 'Материал не может быть пустым' })
  material?: string;

  @Transform(({ value }) => Array.isArray(value) ? value : value ? [value] : [])
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existingImages?: string[];
}