import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsNumber,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
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

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
    boardingPrice?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => CreateRouteStopDto)
  @IsOptional()
    stops?: CreateRouteStopDto[];
}
