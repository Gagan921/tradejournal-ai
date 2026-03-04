import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper for Express controllers
 * Automatically catches errors and passes them to next()
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Typed async handler with custom request type
 */
export const typedAsyncHandler = <T = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
