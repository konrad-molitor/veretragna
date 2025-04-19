 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserStatus } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { mailerService } from '../mailer/mailer.service';

class UserService {
  // Search for a user by ID with a check
  private async findUserById(id: string): Promise<User> {
    const user = await User.findOneBy({ id });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  // Search for a user by email with a check
  private async findUserByEmail(email: string): Promise<User | null> {
    return User.findOneBy({ email });
  }

  // Check if email exists, throw an error if it does
  private async ensureEmailNotExists(email: string): Promise<void> {
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Usuario con este email ya existe');
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const {
      email, firstName, lastName, password,
    } = createUserDto;

    // Check if user with this email already exists
    await this.ensureEmailNotExists(email);

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

  private async confirmUser(otpCode: string): Promise<User> {
    const user = await User.findOneBy({ otpCode });

    if (!user) {
      throw new Error('Código de confirmación inválido');
    }

    user.status = UserStatus.CONFIRMED;
    user.otpCode = null;

    await user.save();

    return user;
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, type: user.type },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' },
    );
  }

  async confirmUserAndLogin(otpCode: string): Promise<{ user: User; token: string }> {
    // First confirm the user
    const user = await this.confirmUser(otpCode);

    // Create JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginUserDto;

    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.status !== UserStatus.CONFIRMED) {
      throw new Error('Usuario no confirmado');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Contraseña inválida');
    }

    // Create JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(userId);

    const {
      email, firstName, lastName, password,
    } = updateUserDto;

    if (email && email !== user.email) {
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('Usuario con este email ya existe');
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
    return this.findUserById(id);
  }
}

export const userService = new UserService();
