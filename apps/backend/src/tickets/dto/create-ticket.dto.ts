import {
  IsNotEmpty, IsNumber, IsUUID, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsUUID()
    tripId: string;

  @IsNotEmpty()
  @IsUUID()
    userId: string;

  @IsNotEmpty()
  @IsUUID()
    startRouteStopId: string;

  @IsNotEmpty()
  @IsUUID()
    endRouteStopId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
    price: number;
}
