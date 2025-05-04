import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchTripsDto {
  @IsUUID()
    fromLocationId: string;

  @IsUUID()
    toLocationId: string;

  @IsDateString()
    departureDate: string;

  @IsDateString()
    returnDate: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
    minTransferMinutes?: number = 5;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
    searchWindowDays?: number = 30;
} 