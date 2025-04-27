import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
} from 'class-validator';
import { BusType } from '../bus.entity';

export class UpdateBusDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
    licensePlate?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
    model?: string;

  @IsEnum(BusType)
  @IsOptional()
    type?: BusType;

  @IsObject()
  @IsNotEmpty()
  @IsOptional()
    totalSeats?: Record<string, number>;
}
