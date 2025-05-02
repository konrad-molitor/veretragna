import {
  IsString,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsOptional,
  Matches,
} from 'class-validator';
import { DayOfWeek } from '../schedule.entity';

export class CreateScheduleDto {
  @IsUUID()
    routeId: string;

  @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'El formato de tiempo debe ser HH:MM:SS',
  })
    departureTime: string;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean;
}
