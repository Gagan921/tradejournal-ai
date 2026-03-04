import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../../services';
import { UserRepository } from '../../repositories';
import { asyncHandler, ApiResponse } from '../../utils';
import { validateBody } from '../middleware';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/\d/, 'New password must contain at least one digit')
    .regex(/[^a-zA-Z0-9]/, 'New password must contain at least one special character'),
});

/**
 * Auth controller
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepository = new UserRepository();
    this.authService = new AuthService(userRepository, null as any);
  }

  /**
   * Register new user
   */
  register = [
    validateBody(registerSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.authService.register(req.body);
      return ApiResponse.created(res, result);
    }),
  ];

  /**
   * Login user
   */
  login = [
    validateBody(loginSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.authService.login(req.body, req.ip);
      return ApiResponse.success(res, result);
    }),
  ];

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    await this.authService.logout(req.user!._id.toString(), refreshToken);
    return ApiResponse.success(res, { message: 'Logged out successfully' });
  });

  /**
   * Refresh access token
   */
  refreshToken = [
    validateBody(refreshTokenSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.authService.refreshToken(req.body.refreshToken);
      return ApiResponse.success(res, result);
    }),
  ];

  /**
   * Verify email
   */
  verifyEmail = [
    validateBody(verifyEmailSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await this.authService.verifyEmail(req.body.token);
      return ApiResponse.success(res, { message: 'Email verified successfully' });
    }),
  ];

  /**
   * Resend verification email
   */
  resendVerification = [
    validateBody(resendVerificationSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await this.authService.resendVerification(req.body.email);
      return ApiResponse.success(res, {
        message: 'If the email exists, a verification link has been sent',
      });
    }),
  ];

  /**
   * Forgot password
   */
  forgotPassword = [
    validateBody(forgotPasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await this.authService.forgotPassword(req.body.email);
      return ApiResponse.success(res, {
        message: 'If the email exists, a password reset link has been sent',
      });
    }),
  ];

  /**
   * Change password
   */
  changePassword = [
    validateBody(changePasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await this.authService.changePassword(
        req.user!._id.toString(),
        req.body.currentPassword,
        req.body.newPassword
      );
      return ApiResponse.success(res, { message: 'Password changed successfully' });
    }),
  ];

  /**
   * Get current user
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.getCurrentUser(req.user!._id.toString());
    return ApiResponse.success(res, user);
  });

  /**
   * Update current user
   */
  updateCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userRepository = new UserRepository();
    const updated = await userRepository.updateUser(req.user!._id.toString(), req.body);
    return ApiResponse.success(res, updated);
  });
}

export default AuthController;
