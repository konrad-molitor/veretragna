import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserType } from '../../users/user.entity';
import { ExpressRequest } from '../types/request';

/**
 * Authentication middleware
 * Extracts JWT token from Authorization header and adds user info to request
 */
export const authenticate = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
      userId: string;
      email: string;
      type: string;
    };

    // Find user in database
    const user = await User.findOneBy({ id: decoded.userId });

    if (!user) {
      next();
      return;
    }

    // Add user to request object
    req.user = user;

    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    console.error('Authentication error:', error);
    next();
  }
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role
 * Admin role has access to all routes by default
 */
export const canActivate = (
  allowedRoles: UserType[] = [],
) => (req: ExpressRequest, res: Response, next: NextFunction): void => {
  // Check if user exists in request (authentication was successful)
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  // Admin always has access
  if (req.user.type === UserType.ADMIN) {
    next();
    return;
  }

  // Check if user role is allowed
  if (allowedRoles.includes(req.user.type)) {
    next();
    return;
  }

  // User role is not allowed
  res.status(403).json({ error: 'No autorizado' });
};
