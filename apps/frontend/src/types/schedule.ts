export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export interface Schedule {
  id: string;
  dayOfWeek: DayOfWeek;
  departureTime: string;
  isActive: boolean;
  route: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleDto {
  routeId: string;
  dayOfWeek: DayOfWeek;
  departureTime: string;
  isActive?: boolean;
}

export interface UpdateScheduleDto {
  routeId?: string;
  dayOfWeek?: DayOfWeek;
  departureTime?: string;
  isActive?: boolean;
}
