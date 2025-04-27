import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity('locations')
export class Location extends BaseEntity {
  @Column()
    name: string;

  @Column({ nullable: true })
    address: string;

  @Column({ nullable: true })
    imageUrl: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
    latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
    longitude: number;

  @Column('text', { nullable: true })
    description: string;
}
