// HTTP Status (for error middleware)
export { HTTP_STATUS } from '../constants';

// Error classes
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  InvalidCredentialsError,
  TokenExpiredError,
  TokenInvalidError,
  EmailNotVerifiedError,
  AccountLockedError,
} from './errors';

// Async handler
export { asyncHandler, typedAsyncHandler } from './asyncHandler';

// API Response
export { ApiResponse, success, created, noContent, paginated, error } from './apiResponse';

// JWT
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  getTimeUntilExpiration,
} from './jwt';

// Password
export {
  hashPassword,
  comparePassword,
  generateRandomToken,
  generateSecureSecret,
  generateNumericCode,
  validatePasswordStrength,
  hashToken,
  compareToken,
} from './password';

// Calculations
export {
  calculateAveragePrice,
  calculateTotalQuantity,
  calculateTotalValue,
  calculatePnL,
  calculateReturnPercent,
  calculateRMultiple,
  calculateHoldingPeriod,
  calculatePositionSize,
  calculateRiskRewardRatio,
  calculateTradeMetrics,
  calculateTradeStatistics,
} from './calculations';
