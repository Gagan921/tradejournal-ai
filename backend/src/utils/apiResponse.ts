import { Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { PaginatedResult, ApiResponse as IApiResponse, ResponseMeta } from '../interfaces';

/**
 * Build response metadata
 */
const buildMeta = (
  req: Express.Request,
  pagination?: { page: number; limit: number; total: number; totalPages: number }
): ResponseMeta => {
  const requestId = (req as any).requestId || 'unknown';
  return {
    requestId,
    timestamp: new Date().toISOString(),
    ...(pagination && { pagination }),
  };
};

/**
 * Send success response
 */
export const success = <T>(
  res: Response,
  data: T,
  pagination?: { page: number; limit: number; total: number; totalPages: number },
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: IApiResponse<T> = {
    success: true,
    data,
    meta: buildMeta(res.req as Express.Request, pagination),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 */
export const created = <T>(res: Response, data: T, message?: string): Response => {
  const response: IApiResponse<T> = {
    success: true,
    data,
    meta: buildMeta(res.req as Express.Request),
  };
  return res.status(HTTP_STATUS.CREATED).json(response);
};

/**
 * Send no content response (204)
 */
export const noContent = (res: Response): Response => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Send paginated response
 */
export const paginated = <T>(
  res: Response,
  result: PaginatedResult<T>
): Response => {
  const { data, pagination } = result;
  return success(res, data, pagination);
};

/**
 * Send error response
 */
export const error = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response => {
  const response: IApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      requestId: (res.req as any).requestId || 'unknown',
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * API Response helper object
 */
export const ApiResponse = {
  success,
  created,
  noContent,
  paginated,
  error,
};

export default ApiResponse;
