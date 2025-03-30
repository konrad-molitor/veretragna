import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity('api_versions')
export class ApiVersion extends BaseEntity {
  @Column()
  version: string;

  @Column({ nullable: true })
  description: string | null;
} 