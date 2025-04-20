import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

export enum UserStatus {
  UNCONFIRMED = 'unconfirmed',
  CONFIRMED = 'confirmed',
  BLOCKED = 'blocked'
}

export enum UserType {
  USER = 'user',
  ADMIN = 'admin',
  DRIVER = 'driver',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
    email: string;

  @Column()
    firstName: string;

  @Column()
    lastName: string;

  @Column()
    passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.USER,
  })
    type: UserType;

  @Column({ nullable: true })
    otpCode: string | null;

  @Column({ nullable: true })
    passwordResetCode: string | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.UNCONFIRMED,
  })
    status: UserStatus;
}
