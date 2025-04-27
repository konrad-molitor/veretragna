import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { BusType } from '../bus.entity';

export class CreateBusDto {
  @IsString()
  @IsNotEmpty()
    licensePlate: string;

  @IsString()
  @IsNotEmpty()
    model: string;

  @IsEnum(BusType)
    type: BusType;

  @IsObject()
  @IsNotEmpty()
    totalSeats: Record<string, number>;
} 