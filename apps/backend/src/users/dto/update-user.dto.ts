import {
  IsEmail, IsOptional, MinLength, Matches,
  IsEnum,
} from 'class-validator';
import { UserStatus, UserType } from '../user.entity';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
      email?: string;

    @IsOptional()
      firstName?: string;

    @IsOptional()
      lastName?: string;

    @IsOptional()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
      password?: string;

  @IsOptional()
  @IsEnum(UserStatus)
    status?: UserStatus;

  @IsOptional()
  @IsEnum(UserType)
    type?: UserType;
}
