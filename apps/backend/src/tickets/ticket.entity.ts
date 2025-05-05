import {
  Entity, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Trip } from '../trips/trip.entity';
import { User } from '../users/user.entity';
import { RouteStop } from '../routes/route-stop.entity';

export enum TicketStatus {
  PAID = 'paid',
  BOARDED = 'boarded',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('tickets')
export class Ticket extends BaseEntity {
  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
    trip: Trip;

  @Column({ name: 'trip_id' })
    tripId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
    user: User;

  @Column({ name: 'user_id' })
    userId: string;

  @ManyToOne(() => RouteStop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'start_route_stop_id' })
    startRouteStop: RouteStop;

  @Column({ name: 'start_route_stop_id' })
    startRouteStopId: string;

  @ManyToOne(() => RouteStop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'end_route_stop_id' })
    endRouteStop: RouteStop;

  @Column({ name: 'end_route_stop_id' })
    endRouteStopId: string;

  @Column('decimal', { precision: 10, scale: 2 })
    price: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    bookingDatetime: Date;

  @Column({ length: 6, unique: true })
    validationCode: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PAID,
  })
    status: TicketStatus;
}
