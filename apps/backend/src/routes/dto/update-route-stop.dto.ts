import { Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  Min,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class UpdateRouteStopDto {
  @IsOptional()
  @IsUUID()
    locationId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
    sequenceOrder: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
    timeOffsetMinutesArrival: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
    stopDurationMinutes: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
    price: number;
}
