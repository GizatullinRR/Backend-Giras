import { IsOptional, IsString } from 'class-validator';

export class ListWorkwearSearchDto {
  @IsOptional()
  @IsString()
  q?: string;
}
