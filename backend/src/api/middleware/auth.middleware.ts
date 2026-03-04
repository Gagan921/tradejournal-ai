import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, UnauthorizedError, TokenExpiredError, TokenInvalidError } from '../../utils';
import { UserRepository } from '../../repositories';

const userRepository = new UserRepository();

/**
 * Authenticate JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new TokenInvalidError();
    }

    // Get user from database
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account deactivated');
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    if (error.name === 'TokenExpiredError') {
      next(new TokenExpiredError());
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      next(new TokenInvalidError());
      return;
    }

    next(new UnauthorizedError('Invalid token'));
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      return next();
    }

    const user = await userRepository.findById(payload.userId);

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Require specific role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new UnauthorizedError('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Require specific permission
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const hasPermission = permissions.every((p) => req.user!.permissions.includes(p));

    if (!hasPermission) {
      next(new UnauthorizedError('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Check if email is verified
 */
export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  if (!req.user.emailVerified) {
    next(new UnauthorizedError('Email verification required', 'AUTH_EMAIL_NOT_VERIFIED'));
    return;
  }

  next();
};
