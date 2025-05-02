import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RouteType } from '../route.entity';
import { CreateRouteStopDto } from './create-route-stop.dto';

export class CreateRouteDto {
  @IsString()
    name: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean;

  @IsEnum(RouteType)
  @IsOptional()
    type?: RouteType;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => CreateRouteStopDto)
  @IsOptional()
    stops?: CreateRouteStopDto[];
}
