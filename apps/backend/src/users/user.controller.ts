import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { userService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userRouter = Router();

// User creation (registration)
userRouter.post('/', async (req: Request, res: Response) => {
  try {
    const createUserDto = plainToClass(CreateUserDto, req.body);
    const errors = await validate(createUserDto);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await userService.createUser(createUserDto);
    return res.status(201).json({
      message: 'User created successfully. Please check your email for confirmation.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(400).json({ error: error.message || 'Failed to create user' });
  }
});

// Registration confirmation
userRouter.get('/confirm', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Confirmation code is missing' });
    }

    await userService.confirmUser(code);

    // Redirect to login page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    return res.redirect(`${frontendUrl}/login?confirmed=true`);
  } catch (error) {
    console.error('Error confirming registration:', error);
    return res.status(400).json({ error: error.message || 'Failed to confirm registration' });
  }
});

// Login
userRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const loginUserDto = plainToClass(LoginUserDto, req.body);
    const errors = await validate(loginUserDto);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { user, token } = await userService.loginUser(loginUserDto);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: user.type,
      },
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(401).json({ error: error.message || 'Authentication error' });
  }
});

// Update user data
userRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateUserDto = plainToClass(UpdateUserDto, req.body);
    const errors = await validate(updateUserDto);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await userService.updateUser(id, updateUserDto);

    return res.json({
      message: 'User data updated',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        type: user.type,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(400).json({ error: error.message || 'Failed to update user data' });
  }
});

// Get all users
userRouter.get('/', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    return res.json(users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })));
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ error: 'Failed to get user list' });
  }
});

// Get user by ID
userRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(404).json({ error: error.message || 'User not found' });
  }
});

export default userRouter;
