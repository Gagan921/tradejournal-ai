import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository';
import { UserModel } from '../models';
import { IUser, IUserDocument, CreateUserDTO, UpdateUserDTO, UpdatePasswordDTO, IRefreshToken } from '../interfaces';
import { hashPassword, comparePassword, generateRandomToken, hashToken } from '../utils';

/**
 * User repository
 */
export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel as any);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase(), isActive: true } as FilterQuery<IUser>);
  }

  /**
   * Find user by email with password hash
   */
  async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase(), isActive: true }).exec();
  }

  /**
   * Find user by OAuth ID
   */
  async findByOAuth(provider: 'google' | 'github', id: string): Promise<IUser | null> {
    const query: any = {};
    query[`oauth.${provider}.id`] = id;
    return this.findOne({ ...query, isActive: true } as FilterQuery<IUser>);
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserDTO): Promise<IUser> {
    const passwordHash = await hashPassword(data.password);

    const user = await this.create({
      email: data.email.toLowerCase(),
      passwordHash,
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        timezone: data.timezone || 'UTC',
        currency: data.currency || 'USD',
      },
    } as Partial<IUser>);

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDTO): Promise<IUser | null> {
    const updateData: any = {};

    if (data.firstName !== undefined) {
      updateData['profile.firstName'] = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateData['profile.lastName'] = data.lastName;
    }
    if (data.avatar !== undefined) {
      updateData['profile.avatar'] = data.avatar;
    }
    if (data.timezone !== undefined) {
      updateData['profile.timezone'] = data.timezone;
    }
    if (data.currency !== undefined) {
      updateData['profile.currency'] = data.currency;
    }
    if (data.language !== undefined) {
      updateData['profile.language'] = data.language;
    }
    if (data.tradingPreferences !== undefined) {
      updateData['tradingPreferences'] = data.tradingPreferences;
    }

    return this.updateById(id, updateData);
  }

  /**
   * Update password
   */
  async updatePassword(id: string, data: UpdatePasswordDTO): Promise<boolean> {
    const user = await UserModel.findById(id).exec();

    if (!user) {
      return false;
    }

    // Verify current password
    const isValid = await user.comparePassword(data.currentPassword);
    if (!isValid) {
      return false;
    }

    // Hash and update new password
    const passwordHash = await hashPassword(data.newPassword);
    user.passwordHash = passwordHash;
    user.security.passwordChangedAt = new Date();
    await user.save();

    return true;
  }

  /**
   * Set password (for OAuth users)
   */
  async setPassword(id: string, password: string): Promise<void> {
    const passwordHash = await hashPassword(password);
    await this.updateById(id, {
      passwordHash,
      'security.passwordChangedAt': new Date(),
    } as any);
  }

  /**
   * Verify password
   */
  async verifyPassword(id: string, password: string): Promise<boolean> {
    const user = await UserModel.findById(id).exec();
    if (!user) return false;
    return user.comparePassword(password);
  }

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(id: string): Promise<string> {
    const token = generateRandomToken(32);
    await this.updateById(id, { emailVerificationToken: token } as any);
    return token;
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ emailVerificationToken: token }).exec();

    if (!user) {
      return null;
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return user.toObject() as IUser;
  }

  /**
   * Link OAuth account
   */
  async linkOAuth(
    id: string,
    provider: 'google' | 'github',
    data: { id: string; email: string }
  ): Promise<void> {
    const updateData: any = {};
    updateData[`oauth.${provider}`] = data;
    await this.updateById(id, updateData);
  }

  /**
   * Unlink OAuth account
   */
  async unlinkOAuth(id: string, provider: 'google' | 'github'): Promise<void> {
    const updateData: any = {};
    updateData[`oauth.${provider}`] = undefined;
    await this.updateById(id, { $unset: updateData });
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string, ipAddress?: string): Promise<void> {
    await this.updateById(id, {
      'security.lastLoginAt': new Date(),
      'security.lastLoginIp': ipAddress,
      'security.loginAttempts': 0,
      'security.lockoutUntil': undefined,
    } as any);
  }

  /**
   * Increment login attempts
   */
  async incrementLoginAttempts(id: string): Promise<void> {
    const user = await UserModel.findById(id).exec();
    if (user) {
      await user.incrementLoginAttempts();
    }
  }

  /**
   * Lock account
   */
  async lockAccount(id: string, durationMinutes: number = 30): Promise<void> {
    await this.updateById(id, {
      'security.lockoutUntil': new Date(Date.now() + durationMinutes * 60 * 1000),
    } as any);
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(id: string): Promise<boolean> {
    const user = await UserModel.findById(id).exec();
    if (!user) return false;
    return user.isLocked();
  }

  /**
   * Soft delete user
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.updateById(id, { isActive: false } as any);
    return result !== null;
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(id: string, field: 'tradesThisMonth' | 'aiInsightsThisMonth'): Promise<void> {
    const updateData: any = {};
    updateData[`usage.${field}`] = 1;
    await UserModel.findByIdAndUpdate(id, { $inc: updateData }).exec();
  }

  /**
   * Update storage usage
   */
  async updateStorageUsage(id: string, bytes: number): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $inc: { 'usage.storageUsed': bytes } }).exec();
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    byPlan: Record<string, number>;
  }> {
    const stats = await UserModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          verified: { $sum: { $cond: ['$emailVerified', 1, 0] } },
          freePlan: { $sum: { $cond: [{ $eq: ['$subscription.plan', 'free'] }, 1, 0] } },
          proPlan: { $sum: { $cond: [{ $eq: ['$subscription.plan', 'pro'] }, 1, 0] } },
          enterprisePlan: { $sum: { $cond: [{ $eq: ['$subscription.plan', 'enterprise'] }, 1, 0] } },
        },
      },
    ]);

    if (stats.length === 0) {
      return { total: 0, active: 0, verified: 0, byPlan: {} };
    }

    const s = stats[0];
    return {
      total: s.total,
      active: s.active,
      verified: s.verified,
      byPlan: {
        free: s.freePlan,
        pro: s.proPlan,
        enterprise: s.enterprisePlan,
      },
    };
  }
}
