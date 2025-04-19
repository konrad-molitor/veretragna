import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserStatus } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { mailerService } from '../mailer/mailer.service';

class UserService {
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const {
      email, firstName, lastName, password,
    } = createUserDto;

    // Check if user with this email already exists
    const existingUser = await User.findOneBy({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create password hash
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP code for email confirmation
    const otpCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create new user
    const user = new User();
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.passwordHash = passwordHash;
    user.otpCode = otpCode;
    user.status = UserStatus.UNCONFIRMED;

    await user.save();

    // Send confirmation email using mailer service
    await mailerService.sendConfirmationEmail(email, otpCode);

    return user;
  }

  async confirmUser(otpCode: string): Promise<User> {
    const user = await User.findOneBy({ otpCode });

    if (!user) {
      throw new Error('Invalid confirmation code');
    }

    user.status = UserStatus.CONFIRMED;
    user.otpCode = null;

    await user.save();

    return user;
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginUserDto;

    const user = await User.findOneBy({ email });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== UserStatus.CONFIRMED) {
      throw new Error('User is not confirmed');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, type: user.type },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' },
    );

    return { user, token };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await User.findOneBy({ id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    const {
      email, firstName, lastName, password,
    } = updateUserDto;

    if (email && email !== user.email) {
      const existingUser = await User.findOneBy({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      user.email = email;
    }

    if (firstName) {
      user.firstName = firstName;
    }

    if (lastName) {
      user.lastName = lastName;
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return User.find();
  }

  async getUserById(id: string): Promise<User> {
    const user = await User.findOneBy({ id });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export const userService = new UserService();
