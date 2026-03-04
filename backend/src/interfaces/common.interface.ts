import { Document, Types } from 'mongoose';

// Base entity interface
export interface IBaseEntity {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Date Range
export interface DateRange {
  start: Date;
  end: Date;
}

// File Upload
export interface IFileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// Device Info
export interface IDeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  name?: string;
  os?: string;
  browser?: string;
}

// Notification Payload
export interface INotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// Cache Options
export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

// Query Filter
export interface QueryFilter {
  [key: string]: unknown;
}

// Sort Options
export interface SortOptions {
  [key: string]: 1 | -1;
}
