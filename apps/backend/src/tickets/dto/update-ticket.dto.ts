import {
  IsOptional, IsNumber, IsUUID, Min, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsUUID()
    tripId?: string;

  @IsOptional()
  @IsUUID()
    userId?: string;

  @IsOptional()
  @IsUUID()
    startRouteStopId?: string;

  @IsOptional()
  @IsUUID()
    endRouteStopId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
    price?: number;

  @IsOptional()
  @IsEnum(TicketStatus)
    status?: TicketStatus;
}
