import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../../utils';

/**
 * Validate request body against Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        throw new ValidationError('Request body validation failed', errors);
      }

      // Replace body with parsed data (includes defaults and transformations)
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate request query against Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        throw new ValidationError('Query validation failed', errors);
      }

      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate request params against Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        throw new ValidationError('Path parameter validation failed', errors);
      }

      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Format Zod errors into a readable object
 */
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.') || 'general';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/[<>]/g, '');
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (values: string[]): string[] => {
  return values.map(sanitizeString).filter((v) => v.length > 0);
};
