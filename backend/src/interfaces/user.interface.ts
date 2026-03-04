import { Document, Types } from 'mongoose';
import { IBaseEntity, IDeviceInfo } from './common.interface';
import { PlanType } from '../constants';

// User Profile
export interface IUserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone: string;
  currency: string;
  language: string;
}

// Trading Preferences
export interface ITradingPreferences {
  defaultCommission: number;
  defaultCommissionType: 'fixed' | 'percentage';
  riskPerTrade: number;
  defaultStrategy?: Types.ObjectId;
  tradingHours: {
    start: string;
    end: string;
  };
}

// Subscription
export interface IUserSubscription {
  plan: PlanType;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

// Usage
export interface IUserUsage {
  tradesThisMonth: number;
  aiInsightsThisMonth: number;
  storageUsed: number;
  lastResetDate: Date;
}

// Security
export interface IUserSecurity {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockoutUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  passwordChangedAt?: Date;
}

// OAuth
export interface IUserOAuth {
  google?: {
    id: string;
    email: string;
  };
  github?: {
    id: string;
    email: string;
  };
}

// Main User Interface
export interface IUser extends IBaseEntity {
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  profile: IUserProfile;
  tradingPreferences: ITradingPreferences;
  subscription: IUserSubscription;
  usage: IUserUsage;
  security: IUserSecurity;
  oauth: IUserOAuth;
  role: 'user' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
}

// User Document (Mongoose)
export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
  getFullName(): string;
  hasPermission(permission: string): boolean;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// User DTOs
export interface CreateUserDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  currency?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  tradingPreferences?: Partial<ITradingPreferences>;
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// Login DTOs
export interface LoginDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

// User Response (sanitized)
export interface UserResponse {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: IUserProfile;
  tradingPreferences: ITradingPreferences;
  subscription: IUserSubscription;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh Token
export interface IRefreshToken extends IBaseEntity {
  userId: Types.ObjectId;
  tokenHash: string;
  device?: IDeviceInfo;
  ipAddress?: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  replacedByToken?: Types.ObjectId;
  lastUsedAt?: Date;
}

export interface CreateRefreshTokenDTO {
  userId: string;
  token: string;
  device?: IDeviceInfo;
  ipAddress?: string;
  expiresAt: Date;
}
