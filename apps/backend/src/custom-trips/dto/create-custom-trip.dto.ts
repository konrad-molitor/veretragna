import {
  IsString, IsEmail, IsArray, IsNumber, IsOptional, IsDateString,
} from 'class-validator';
import { RouteStopData } from '../custom-trip.entity';

export class CreateCustomTripDto {
  @IsString()
    name: string;

  @IsOptional()
  @IsString()
    description?: string;

  @IsArray()
    route: RouteStopData[];

  @IsArray()
  @IsString({ each: true })
    busIds: string[];

  @IsArray()
  @IsString({ each: true })
    driverIds: string[];

  @IsDateString()
    startDateTime: string;

  @IsNumber()
    price: number;

  @IsNumber()
    maxSeats: number;

  @IsEmail()
    customerEmail: string;

  @IsString()
    customerName: string;

  @IsOptional()
  @IsString()
    customerPhone?: string;
} 