import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

export enum BusType {
  MINI = 'mini',
  TOURIST = 'tourist',
  STANDARD = 'standard',
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
    default: BusType.STANDARD,
  })
    type: BusType;

  @Column('json')
    totalSeats: Record<string, number>;
} 