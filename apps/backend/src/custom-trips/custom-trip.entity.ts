import {
  Entity, Column, ManyToMany, JoinTable,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Bus } from '../buses/bus.entity';
import { User } from '../users/user.entity';

export enum CustomTripStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface RouteStopData {
  location: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  sequenceOrder: number;
  timeOffsetMinutesArrival: number;
  stopDurationMinutes: number;
}

@Entity('custom_trips')
export class CustomTrip extends BaseEntity {
  @Column()
    name: string;

  @Column('text', { nullable: true })
    description: string;

  @Column('json')
    route: RouteStopData[];

  @ManyToMany(() => Bus)
  @JoinTable({
    name: 'custom_trip_buses',
    joinColumn: { name: 'custom_trip_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'bus_id', referencedColumnName: 'id' },
  })
    buses: Bus[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'custom_trip_drivers',
    joinColumn: { name: 'custom_trip_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'driver_id', referencedColumnName: 'id' },
  })
    drivers: User[];

  @Column({ type: 'timestamp' })
    startDateTime: Date;

  @Column('decimal', { precision: 10, scale: 2 })
    price: number;

  @Column()
    maxSeats: number;

  @Column()
    bookedSeats: number;

  @Column()
    customerEmail: string;

  @Column()
    customerName: string;

  @Column({ nullable: true })
    customerPhone: string;

  @Column({
    type: 'enum',
    enum: CustomTripStatus,
    default: CustomTripStatus.PENDING_PAYMENT,
  })
    status: CustomTripStatus;

  @Column({ unique: true })
    paymentToken: string;
}