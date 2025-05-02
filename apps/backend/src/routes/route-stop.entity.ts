import {
  Entity, Column, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Route } from './route.entity';
import { Location } from '../locations/location.entity';

@Entity('route_stops')
@Unique(['route', 'location', 'sequenceOrder'])
export class RouteStop extends BaseEntity {
  @ManyToOne(() => Route, (route) => route.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
    route: Route;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
    location: Location;

  @Column()
    sequenceOrder: number;

  @Column()
    timeOffsetMinutesArrival: number;

  @Column()
    stopDurationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;
}
