import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { userService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from './user.entity';
import { ExpressRequest } from '../common/types/request';

const userRouter = Router();

// Get current user profile
userRouter.get('/me', canActivate([UserType.USER]), async (req: ExpressRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const user = await userService.getCurrentUser(req.user.id);

    res.json({
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
    console.error('Error getting current user:', error);
    res.status(500).json({ error: error.message || 'Error al obtener el perfil del usuario' });
  }
});

// Update current user profile
userRouter.patch('/me', canActivate([UserType.USER]), async (req: ExpressRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const updateUserDto = plainToClass(UpdateUserDto, req.body);
    const errors = await validate(updateUserDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const user = await userService.updateUser(req.user.id, updateUserDto);

    res.json({
      message: 'Perfil actualizado correctamente',
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
    console.error('Error updating user profile:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar el perfil del usuario' });
  }
});

// User creation (registration)
userRouter.post('/', async (req: ExpressRequest, res: Response) => {
  try {
    const createUserDto = plainToClass(CreateUserDto, req.body);
    const errors = await validate(createUserDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const user = await userService.createUser(createUserDto);
    res.status(201).json({
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
    res.status(400).json({ error: error.message || 'Error al crear el usuario' });
  }
});

// Registration confirmation
userRouter.get('/confirm', async (req: ExpressRequest, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'El código de confirmación está faltando' });
      return;
    }

    // Confirm user and get token
    const { user, token } = await userService.confirmUserAndLogin(code);

    // Return user data and token instead of redirecting
    res.json({
      message: 'Registro confirmado correctamente. Ya puedes iniciar sesión.',
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
    console.error('Error confirming registration:', error);
    res.status(400).json({ error: error.message || 'Error al confirmar el registro' });
  }
});

// Login
userRouter.post('/login', async (req: ExpressRequest, res: Response) => {
  try {
    const loginUserDto = plainToClass(LoginUserDto, req.body);
    const errors = await validate(loginUserDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const { user, token } = await userService.loginUser(loginUserDto);

    res.json({
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
    res.status(401).json({ error: error.message || 'Error al iniciar sesión' });
  }
});

// Update user data
userRouter.patch('/:id', canActivate([UserType.USER]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Authorization check: users can only update their own data
    if (req.user?.type !== UserType.ADMIN && req.user?.id !== id) {
      res.status(403).json({ error: 'No autorizado para actualizar este usuario' });
      return;
    }

    const updateUserDto = plainToClass(UpdateUserDto, req.body);
    const errors = await validate(updateUserDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const user = await userService.updateUser(id, updateUserDto);

    res.json({
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
    res.status(400).json({ error: error.message || 'Error al actualizar los datos del usuario' });
  }
});

// Get all users (admin only)
userRouter.get('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users.map((user) => ({
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
    res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
});

// Get user by ID (admin and self access)
userRouter.get('/:id', canActivate([UserType.USER]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Authorization check: users can only view their own data
    if (req.user?.type !== UserType.ADMIN && req.user?.id !== id) {
      res.status(403).json({ error: 'No autorizado para ver este usuario' });
      return;
    }

    const user = await userService.getUserById(id);

    res.json({
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
    res.status(404).json({ error: error.message || 'Usuario no encontrado' });
  }
});

// Forgot password request
userRouter.post('/forgot-password', async (req: ExpressRequest, res: Response) => {
  try {
    const forgotPasswordDto = plainToClass(ForgotPasswordDto, req.body);
    const errors = await validate(forgotPasswordDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    await userService.initResetPassword(forgotPasswordDto);

    // Always return success to avoid revealing user existence
    res.json({
      message: 'Si existe una cuenta con ese correo electrónico, recibirás un enlace para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error('Error initiating password reset:', error);
    res.status(400).json({ error: error.message || 'Error al iniciar el restablecimiento de contraseña' });
  }
});

// Reset password
userRouter.post('/reset-password', async (req: ExpressRequest, res: Response) => {
  try {
    const resetPasswordDto = plainToClass(ResetPasswordDto, req.body);
    const errors = await validate(resetPasswordDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const user = await userService.resetPassword(resetPasswordDto);

    res.json({
      message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(400).json({ error: error.message || 'Error al restablecer la contraseña' });
  }
});

export default userRouter;
