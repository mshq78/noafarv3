/**
 * Convert Latin/English digits to Persian digits (۰۱۲۳۴۵۶۷۸۹)
 * Enforced globally for all user-facing numbers.
 */
export function toFaDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

/**
 * Convert Persian and Arabic digits to standard Latin/English digits (0-9)
 */
export function toEnDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Format seconds into a friendly Persian duration (e.g. '۱۲ دقیقه' or '۱ ساعت و ۲۰ دقیقه')
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return toFaDigits('۰ دقیقه');
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    if (remainingMinutes > 0) {
      return `${toFaDigits(hours)} ساعت و ${toFaDigits(remainingMinutes)} دقیقه`;
    }
    return `${toFaDigits(hours)} ساعت`;
  }
  return `${toFaDigits(minutes || 1)} دقیقه`;
}

/**
 * Format minutes into Persian string (e.g. '۴۵ دقیقه')
 */
export function formatMinutes(minutes: number): string {
  return `${toFaDigits(minutes)} دقیقه`;
}

/**
 * Format file size into readable Persian string (e.g. '۲.۴ مگابایت')
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) {
    return `${toFaDigits(bytes)} بایت`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${toFaDigits(kb.toFixed(1))} کیلوبایت`;
  }
  const mb = kb / 1024;
  return `${toFaDigits(mb.toFixed(1))} مگابایت`;
}

/**
 * Format counts like likes, views, comments
 */
export function formatCount(count: number): string {
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1);
    return `${toFaDigits(k)} هزار`;
  }
  return toFaDigits(count);
}
