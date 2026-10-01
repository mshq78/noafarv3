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

/** Persian names for the content form's fields, so a message can say which one. */
export const CONTENT_FIELD_LABELS: Record<string, string> = {
  title: 'عنوان',
  slug: 'نامک',
  summary: 'خلاصه',
  body: 'متن کامل',
  status: 'وضعیت انتشار',
  publishedAt: 'زمان انتشار',
  category: 'دسته‌بندی',
  tags: 'کلیدواژه‌ها',
  heroImage: 'تصویر شاخص',
  gallery: 'گالری',
  attachments: 'پیوست‌ها',
  author: 'نویسنده',
  data: 'فیلدهای ویژهٔ این بخش',
  url: 'نشانی فایل',
  fileName: 'نام فایل',
};

interface ValidationIssue {
  code?: string;
  path: PropertyKey[];
  message: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  origin?: string;
}

const faDigits = (value: unknown): string =>
  String(value).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!);

const hasPersian = (text: string) => /[؀-ۿ]/.test(text);

/**
 * Turns the first few validation issues into one sentence a person can act on:
 * which field, and what is wrong with it. A message the schema already wrote in
 * Persian is kept; zod's own English defaults ("Too small: expected string to
 * have >=2 characters") are replaced rather than shown to an editor.
 */
export function describeValidationIssues(
  issues: readonly ValidationIssue[],
  labels: Record<string, string> = CONTENT_FIELD_LABELS,
  limit = 3,
): string {
  const parts = issues.slice(0, limit).map((issue) => {
    const keys = issue.path.filter((segment): segment is string => typeof segment === 'string');
    const label = keys.map((key) => labels[key]).find(Boolean) ?? keys[0];
    const prefix = label ? `«${label}»: ` : '';

    if (issue.message && hasPersian(issue.message)) return `${prefix}${issue.message}`;

    const isText = !issue.origin || issue.origin === 'string';
    switch (issue.code) {
      case 'too_small':
        return `${prefix}${isText ? `حداقل ${faDigits(issue.minimum)} نویسه لازم است` : `حداقل ${faDigits(issue.minimum)} مورد لازم است`}`;
      case 'too_big':
        return `${prefix}${isText ? `بیش از ${faDigits(issue.maximum)} نویسه مجاز نیست` : `بیش از ${faDigits(issue.maximum)} مورد مجاز نیست`}`;
      case 'invalid_type':
        return `${prefix}مقدار واردشده نوع درستی ندارد`;
      case 'invalid_value':
        return `${prefix}مقدار انتخاب‌شده معتبر نیست`;
      default:
        return `${prefix}مقدار واردشده معتبر نیست`;
    }
  });
  const more = issues.length > limit ? ` (و ${faDigits(issues.length - limit)} مورد دیگر)` : '';
  return `${parts.join('؛ ')}${more}`;
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps an async route so rejected promises reach the Express error handler. */
export function asyncRoute(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
