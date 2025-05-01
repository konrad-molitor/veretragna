import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
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
} 