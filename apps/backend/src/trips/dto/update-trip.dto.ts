import {
  IsString,
  IsDate,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripStatus } from '../trip.entity';

export class UpdateTripDto {
  @IsString()
  @IsOptional()
    scheduleId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
    departureDateTime?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
    arrivalDateTime?: Date;

  @IsString()
  @IsOptional()
    busId?: string;

  @IsString()
  @IsOptional()
    driverId?: string;

  @IsEnum(TripStatus)
  @IsOptional()
    status?: TripStatus;
}
