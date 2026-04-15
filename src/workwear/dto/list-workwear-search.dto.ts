import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListWorkwearSearchDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
