import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { userService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
    return res.status(400).json({ error: error.message || 'Error al crear el usuario' });
  }
});

// Registration confirmation
userRouter.get('/confirm', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'El código de confirmación está faltando' });
    }

    // Confirm user and get token
    const { user, token } = await userService.confirmUserAndLogin(code);

    // Return user data and token instead of redirecting
    return res.json({
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
    return res.status(400).json({ error: error.message || 'Error al confirmar el registro' });
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
    return res.status(401).json({ error: error.message || 'Error al iniciar sesión' });
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
    return res.status(400).json({ error: error.message || 'Error al actualizar los datos del usuario' });
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
    return res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
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
    return res.status(404).json({ error: error.message || 'Usuario no encontrado' });
  }
});

// Forgot password request
userRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const forgotPasswordDto = plainToClass(ForgotPasswordDto, req.body);
    const errors = await validate(forgotPasswordDto);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await userService.initResetPassword(forgotPasswordDto);

    // Always return success to avoid revealing user existence
    return res.json({
      message: 'Si existe una cuenta con ese correo electrónico, recibirás un enlace para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error('Error initiating password reset:', error);
    return res.status(400).json({ error: error.message || 'Error al iniciar el restablecimiento de contraseña' });
  }
});

// Reset password
userRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const resetPasswordDto = plainToClass(ResetPasswordDto, req.body);
    const errors = await validate(resetPasswordDto);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await userService.resetPassword(resetPasswordDto);

    return res.json({
      message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(400).json({ error: error.message || 'Error al restablecer la contraseña' });
  }
});

export default userRouter;
