import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
import { toFaDigits } from './format';

// Extend dayjs with Jalali calendar support
// @ts-ignore
dayjs.extend(jalaliday);

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Format ISO date to Persian human readable date (e.g. '۱۲ اردیبهشت ۱۴۰۳')
 */
export function formatPersianDate(dateString: string, _format?: string): string {
  try {
    // @ts-ignore
    const d = dayjs(dateString).calendar('jalali');
    const day = toFaDigits(d.date());
    const month = PERSIAN_MONTHS[d.month()];
    const year = toFaDigits(d.year());
    return `${day} ${month} ${year}`;
  } catch {
    return toFaDigits(dateString);
  }
}

/**
 * Format ISO date to Persian relative or short date
 */
export function formatPersianShortDate(dateString: string): string {
  try {
    // @ts-ignore
    const d = dayjs(dateString).calendar('jalali');
    const day = toFaDigits(d.date());
    const month = PERSIAN_MONTHS[d.month()];
    return `${day} ${month}`;
  } catch {
    return toFaDigits(dateString);
  }
}

/**
 * Format relative time ago in Persian (e.g. '۳ روز پیش', '۲ ساعت پیش')
 */
export function formatTimeAgo(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'لحظاتی پیش';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${toFaDigits(diffMin)} دقیقه پیش`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${toFaDigits(diffHour)} ساعت پیش`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${toFaDigits(diffDay)} روز پیش`;
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${toFaDigits(diffMonth)} ماه پیش`;
    return formatPersianDate(dateString);
  } catch {
    return formatPersianDate(dateString);
  }
}

/**
 * Format Jalali year for Experience section (strictly year only, e.g. '۱۴۰۳')
 */
export function formatJalaliYear(year: number): string {
  return toFaDigits(year);
}
