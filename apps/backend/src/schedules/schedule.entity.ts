import {
  Entity, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Route } from '../routes/route.entity';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

@Entity('schedules')
export class Schedule extends BaseEntity {
  @ManyToOne(() => Route, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
    route: Route;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
    dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
    departureTime: string;

  @Column({ default: true })
    isActive: boolean;
}
