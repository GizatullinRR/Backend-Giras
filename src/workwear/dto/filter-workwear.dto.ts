import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { WorkwearCategory } from '../enums/category.enum';
import { Transform, Type } from 'class-transformer';
import { WorkwearSeason } from '../enums/season.enum';
import { WorkwearItemSet } from '../enums/set.enum';
import { parseBooleanLike } from '../../common/parse-boolean-like';

export class FilterWorkwearDto {
  @IsOptional()
  @IsEnum(WorkwearCategory, {
    message: `Категория должна быть одной из: ${Object.values(WorkwearCategory).join(', ')}`,
  })
  category?: WorkwearCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceTo?: number;

  @IsOptional()
  @IsEnum(WorkwearSeason, {
    message: `Сезон должен быть одним из значений: ${Object.values(WorkwearSeason).join(', ')}`,
  })
  season?: WorkwearSeason;

  @IsOptional()
  @IsEnum(WorkwearItemSet, {
    message: `Комплект должен быть одним из значений: ${Object.values(WorkwearItemSet).join(', ')}`,
  })
  set?: WorkwearItemSet;

  @IsOptional()
  @Transform(
    ({ obj, value }) =>
      parseBooleanLike(obj?.isCertified) ?? parseBooleanLike(value) ?? value,
  )
  @IsBoolean({
    message: 'Статус сертификации должен быть логическим значением',
  })
  isCertified?: boolean;
}
