import {
  Entity, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Schedule } from '../schedules/schedule.entity';
import { Bus } from '../buses/bus.entity';
import { User } from '../users/user.entity';

export enum TripStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('trips')
export class Trip extends BaseEntity {
  @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
    schedule: Schedule;

  @Column({ name: 'schedule_id' })
    scheduleId: string;

  @Column({ type: 'datetime' })
    departureDateTime: Date;

  @Column({ type: 'datetime' })
    arrivalDateTime: Date;

  @ManyToOne(() => Bus, { nullable: true })
  @JoinColumn({ name: 'bus_id' })
    bus: Bus | null;

  @Column({ name: 'bus_id', nullable: true })
    busId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
    driver: User | null;

  @Column({ name: 'driver_id', nullable: true })
    driverId: string | null;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.PENDING,
  })
    status: TripStatus;
}
