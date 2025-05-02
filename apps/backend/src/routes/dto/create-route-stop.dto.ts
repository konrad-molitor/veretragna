import {
  IsString,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateRouteStopDto {
  @IsUUID()
    locationId: string;

  @IsNumber()
  @Min(1)
    sequenceOrder: number;

  @IsNumber()
  @Min(0)
    timeOffsetMinutesArrival: number;

  @IsNumber()
  @Min(0)
    stopDurationMinutes: number;
}
