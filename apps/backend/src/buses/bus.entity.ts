import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

export enum BusType {
  MICROBUS = 'microbus',
  OMNIBUS = 'omnibus',
  MINIBUS = 'minibus',
}

@Entity('buses')
export class Bus extends BaseEntity {
  @Column({ unique: true })
    licensePlate: string;

  @Column()
    model: string;

  @Column({
    type: 'enum',
    enum: BusType,
    default: BusType.MINIBUS,
  })
    type: BusType;

  @Column('json')
    totalSeats: Record<string, number>;
}
