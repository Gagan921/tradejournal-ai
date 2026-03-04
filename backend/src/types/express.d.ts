import { IUserDocument } from '../interfaces';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      requestId: string;
      startTime: number;
    }
  }
}

export {};
