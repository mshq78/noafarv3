import type { NextFunction, Request, Response } from 'express';

/** An error carrying an HTTP status and a Persian, user-facing message. */
export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, 'bad_request', details);
export const unauthorized = (message = 'برای انجام این کار باید وارد حساب کاربری خود شوید.') =>
  new HttpError(401, message, 'unauthorized');
export const forbidden = (message = 'شما به این بخش دسترسی ندارید.') =>
  new HttpError(403, message, 'forbidden');
export const notFound = (message = 'مورد درخواستی یافت نشد.') =>
  new HttpError(404, message, 'not_found');
export const conflict = (message: string) => new HttpError(409, message, 'conflict');
export const tooManyRequests = (message: string, retryAfterSeconds?: number) =>
  new HttpError(429, message, 'too_many_requests', { retryAfterSeconds });

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps an async route so rejected promises reach the Express error handler. */
export function asyncRoute(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
