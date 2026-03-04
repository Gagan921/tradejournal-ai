import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserDocument, IUserProfile, IUserSubscription, IUserUsage, IUserSecurity, IUserOAuth, ITradingPreferences } from '../interfaces';
import { TRADE_CONSTANTS } from '../constants';

// Profile Schema
const ProfileSchema = new Schema<IUserProfile>({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  avatar: { type: String },
  timezone: { type: String, default: 'UTC' },
  currency: { type: String, default: 'USD' },
  language: { type: String, default: 'en' },
}, { _id: false });

// Trading Preferences Schema
const TradingPreferencesSchema = new Schema<ITradingPreferences>({
  defaultCommission: { type: Number, default: 0 },
  defaultCommissionType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  riskPerTrade: { type: Number, default: 1 },
  defaultStrategy: { type: Schema.Types.ObjectId, ref: 'Strategy' },
  tradingHours: {
    start: { type: String, default: '09:30' },
    end: { type: String, default: '16:00' },
  },
}, { _id: false });

// Subscription Schema
const SubscriptionSchema = new Schema<IUserSubscription>({
  plan: { type: String, enum: Object.values(TRADE_CONSTANTS.PLANS), default: 'free' },
  status: { type: String, enum: ['active', 'cancelled', 'past_due', 'trialing'], default: 'active' },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
}, { _id: false });

// Usage Schema
const UsageSchema = new Schema<IUserUsage>({
  tradesThisMonth: { type: Number, default: 0 },
  aiInsightsThisMonth: { type: Number, default: 0 },
  storageUsed: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
}, { _id: false });

// Security Schema
const SecuritySchema = new Schema<IUserSecurity>({
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  loginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  passwordChangedAt: { type: Date },
}, { _id: false });

// OAuth Schema
const OAuthSchema = new Schema<IUserOAuth>({
  google: {
    id: { type: String },
    email: { type: String },
  },
  github: {
    id: { type: String },
    email: { type: String },
  },
}, { _id: false });

// Main User Schema
const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      index: true,
    },
    profile: {
      type: ProfileSchema,
      default: () => ({}),
    },
    tradingPreferences: {
      type: TradingPreferencesSchema,
      default: () => ({}),
    },
    subscription: {
      type: SubscriptionSchema,
      default: () => ({ plan: 'free', status: 'active' }),
    },
    usage: {
      type: UsageSchema,
      default: () => ({}),
    },
    security: {
      type: SecuritySchema,
      default: () => ({}),
    },
    oauth: {
      type: OAuthSchema,
      default: () => ({}),
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.emailVerificationToken;
        delete ret.security?.twoFactorSecret;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.emailVerificationToken;
        delete ret.security?.twoFactorSecret;
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'oauth.google.id': 1 }, { sparse: true });
UserSchema.index({ 'oauth.github.id': 1 }, { sparse: true });
UserSchema.index({ 'subscription.stripeCustomerId': 1 }, { sparse: true });
UserSchema.index({ emailVerificationToken: 1 }, { expireAfterSeconds: 86400 });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function (this: IUserDocument) {
  const { firstName, lastName } = this.profile;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return firstName || lastName || this.email;
});

// Instance method: compare password
UserSchema.methods.comparePassword = async function (
  this: IUserDocument,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

// Instance method: get full name
UserSchema.methods.getFullName = function (this: IUserDocument): string {
  return this.fullName;
};

// Instance method: check permission
UserSchema.methods.hasPermission = function (this: IUserDocument, permission: string): boolean {
  return this.permissions.includes(permission) || this.role === 'admin';
};

// Instance method: check if account is locked
UserSchema.methods.isLocked = function (this: IUserDocument): boolean {
  return !!(this.security.lockoutUntil && this.security.lockoutUntil > new Date());
};

// Instance method: increment login attempts
UserSchema.methods.incrementLoginAttempts = async function (this: IUserDocument): Promise<void> {
  this.security.loginAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.security.loginAttempts >= 5) {
    this.security.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  await this.save();
};

// Instance method: reset login attempts
UserSchema.methods.resetLoginAttempts = async function (this: IUserDocument): Promise<void> {
  this.security.loginAttempts = 0;
  this.security.lockoutUntil = undefined;
  await this.save();
};

// Static method: find by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Pre-save middleware
UserSchema.pre('save', function (next) {
  // Reset usage counters on new month
  const now = new Date();
  const lastReset = this.usage?.lastResetDate;

  if (lastReset && lastReset.getMonth() !== now.getMonth()) {
    this.usage.tradesThisMonth = 0;
    this.usage.aiInsightsThisMonth = 0;
    this.usage.lastResetDate = now;
  }

  next();
});

// Create and export model
export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel;
