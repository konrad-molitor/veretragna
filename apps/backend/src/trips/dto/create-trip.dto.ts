import {
  IsString,
  IsDate,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripStatus } from '../trip.entity';

export class CreateTripDto {
  @IsString()
    scheduleId: string;

  @IsDate()
  @Type(() => Date)
    departureDateTime: Date;

  @IsDate()
  @Type(() => Date)
    arrivalDateTime: Date;

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
