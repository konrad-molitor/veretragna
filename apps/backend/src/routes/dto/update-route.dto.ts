import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RouteType } from '../route.entity';

export class UpdateRouteDto {
  @IsString()
  @IsOptional()
    name?: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean;

  @IsEnum(RouteType)
  @IsOptional()
    type?: RouteType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
    boardingPrice?: number;
}
