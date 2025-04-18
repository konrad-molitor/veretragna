import {
  IsEmail, IsNotEmpty, MinLength, Matches,
} from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsEmail()
      email: string;

    @IsNotEmpty()
      firstName: string;

    @IsNotEmpty()
      lastName: string;

    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
      password: string;
}
