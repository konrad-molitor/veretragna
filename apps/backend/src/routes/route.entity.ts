import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { RouteStop } from './route-stop.entity';

export enum RouteType {
  DIRECT = 'direct',
  SEMI_DIRECT = 'semi-direct',
  REGULAR = 'regular'
}

@Entity('routes')
export class Route extends BaseEntity {
  @Column()
    name: string;

  @Column('text', { nullable: true })
    description: string;

  @Column({ default: true })
    isActive: boolean;

  @Column({
    type: 'enum',
    enum: RouteType,
    default: RouteType.REGULAR,
  })
    type: RouteType;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
  })
    boardingPrice: number;

  @OneToMany(() => RouteStop, (routeStop) => routeStop.route, { cascade: true })
    stops: RouteStop[];
}
