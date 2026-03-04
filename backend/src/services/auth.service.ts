import { UserRepository } from '../repositories';
import {
  generateTokens,
  verifyRefreshToken,
  hashToken,
  compareToken,
  generateRandomToken,
  InvalidCredentialsError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  TokenExpiredError,
  TokenInvalidError,
  AccountLockedError,
  EmailNotVerifiedError,
} from '../utils';
import {
  CreateUserDTO,
  LoginDTO,
  AuthResponse,
  UserResponse,
  TokenPayload,
  CreateRefreshTokenDTO,
} from '../interfaces';
import { logger, cacheUtils } from '../config';

/**
 * Auth service
 */
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private refreshTokenRepository: any // Will be implemented
  ) {}

  /**
   * Register new user
   */
  async register(data: CreateUserDTO): Promise<AuthResponse> {
    // Check if email exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Create user
    const user = await this.userRepository.createUser(data);

    // Generate email verification token
    const verificationToken = await this.userRepository.generateEmailVerificationToken(
      user._id.toString()
    );

    // TODO: Send verification email
    logger.info('User registered', { userId: user._id, email: user.email });

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDTO, ipAddress?: string): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new AccountLockedError(user.security.lockoutUntil!);
    }

    // Verify password
    const isValid = await user.comparePassword(data.password);
    if (!isValid) {
      await this.userRepository.incrementLoginAttempts(user._id.toString());
      throw new InvalidCredentialsError();
    }

    // Check if email is verified (skip in development)
    // if (!user.emailVerified) {
    //   throw new EmailNotVerifiedError();
    // }

    // Reset login attempts and update last login
    await this.userRepository.updateLastLogin(user._id.toString(), ipAddress);

    logger.info('User logged in', { userId: user._id, email: user.email });

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return {
      user: this.sanitizeUser(user.toObject()),
      tokens,
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    // TODO: Invalidate refresh token if provided
    logger.info('User logged out', { userId });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      if (payload.type !== 'refresh') {
        throw new TokenInvalidError();
      }

      // Check if user exists and is active
      const user = await this.userRepository.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new TokenInvalidError();
      }

      // Generate new access token
      const accessToken = generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      }).accessToken;

      return {
        accessToken,
        expiresIn: 900, // 15 minutes
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new TokenInvalidError();
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.verifyEmail(token);
    if (!user) {
      throw new NotFoundError('Verification token');
    }
    logger.info('Email verified', { userId: user._id });
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    if (user.emailVerified) {
      return;
    }

    const token = await this.userRepository.generateEmailVerificationToken(user._id.toString());
    // TODO: Send verification email
    logger.info('Verification email resent', { userId: user._id });
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = generateRandomToken(32);
    const resetTokenHash = await hashToken(resetToken);

    // Store in cache with 1 hour expiration
    await cacheUtils.set(`password-reset:${user._id}`, resetTokenHash, 3600);

    // TODO: Send reset email with resetToken
    logger.info('Password reset requested', { userId: user._id });
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user by iterating through cache keys (not efficient, but works for now)
    // In production, use a proper token storage
    // This is a simplified implementation
    throw new Error('Not implemented');
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const success = await this.userRepository.updatePassword(userId, {
      currentPassword,
      newPassword,
    });

    if (!success) {
      throw new InvalidCredentialsError();
    }

    logger.info('Password changed', { userId });
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.sanitizeUser(user);
  }

  /**
   * OAuth login/register
   */
  async oauthLogin(
    provider: 'google' | 'github',
    profile: { id: string; email: string; name?: string }
  ): Promise<AuthResponse> {
    // Try to find existing user by OAuth ID
    let user = await this.userRepository.findByOAuth(provider, profile.id);

    if (user) {
      // Existing user - login
      logger.info('OAuth login', { userId: user._id, provider });
    } else {
      // Try to find by email
      user = await this.userRepository.findByEmail(profile.email);

      if (user) {
        // Link OAuth to existing account
        await this.userRepository.linkOAuth(user._id.toString(), provider, {
          id: profile.id,
          email: profile.email,
        });
        logger.info('OAuth linked to existing account', { userId: user._id, provider });
      } else {
        // Create new user
        const names = profile.name?.split(' ') || ['', ''];
        user = await this.userRepository.createUser({
          email: profile.email,
          password: generateRandomToken(32), // Random password
          firstName: names[0],
          lastName: names.slice(1).join(' '),
        });

        await this.userRepository.linkOAuth(user._id.toString(), provider, {
          id: profile.id,
          email: profile.email,
        });

        // Mark email as verified (OAuth providers verify email)
        await this.userRepository.verifyEmail(''); // TODO: Implement properly

        logger.info('New user via OAuth', { userId: user._id, provider });
      }
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Sanitize user for response
   */
  private sanitizeUser(user: any): UserResponse {
    return {
      id: user._id.toString(),
      email: user.email,
      emailVerified: user.emailVerified,
      profile: user.profile,
      tradingPreferences: user.tradingPreferences,
      subscription: user.subscription,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
