/**
 * Jalali (Persian) calendar arithmetic, and Iran-time helpers for scheduling.
 *
 * The conversion is the standard arithmetic one (33-year leap cycles with the
 * published break table), so it needs no library and no ICU data, and it is
 * checked against the platform's own Persian calendar in the project's tests.
 *
 * Iran has not used daylight saving time since 2022: the offset is a constant
 * +03:30, which is what lets a schedule be turned into an instant by plain
 * arithmetic instead of a time-zone database.
 */

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

const div = (a: number, b: number): number => Math.trunc(a / b);
const mod = (a: number, b: number): number => a - Math.trunc(a / b) * b;

/** Leap-year position, the Gregorian year it starts in, and its March day. */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0]!;
  let jump = 0;
  if (jy < jp || jy >= BREAKS[bl - 1]!) throw new RangeError(`سال شمسی ${jy} پشتیبانی نمی‌شود.`);

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i]!;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

const g2d = (gy: number, gm: number, gd: number): number => {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
};

const d2g = (jdn: number): { gy: number; gm: number; gd: number } => {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
};

const j2d = (jy: number, jm: number, jd: number): number => {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
};

const d2j = (jdn: number): { jy: number; jm: number; jd: number } => {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
};

export function isJalaliLeapYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** Days in a Jalali month: 31 for the first six, 30 for the next five, then 29 or 30. */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return d2j(g2d(gy, gm, gd));
}

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/** Iran Standard Time, in minutes east of UTC. */
const IRAN_OFFSET_MINUTES = 3 * 60 + 30;

export interface IranDateTime {
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
}

/** The Iranian wall-clock reading of an instant. */
export function toIranDateTime(input: Date | string | number): IranDateTime {
  const shifted = new Date(new Date(input).getTime() + IRAN_OFFSET_MINUTES * 60_000);
  const { jy, jm, jd } = gregorianToJalali(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
  return { jy, jm, jd, hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes() };
}

/** The instant at which the Iranian wall clock reads the given Jalali date and time. */
export function fromIranDateTime({ jy, jm, jd, hour, minute }: IranDateTime): Date {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  return new Date(Date.UTC(gy, gm - 1, gd, hour, minute) - IRAN_OFFSET_MINUTES * 60_000);
}

/** "۱۴۰۵/۰۷/۲۰ — ۰۹:۳۰" in Persian digits, as Iran's clock shows it. */
export function formatIranDateTime(input: Date | string | number): string {
  const { jy, jm, jd, hour, minute } = toIranDateTime(input);
  const two = (n: number) => String(n).padStart(2, '0');
  const text = `${jy}/${two(jm)}/${two(jd)} — ${two(hour)}:${two(minute)}`;
  return text.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!);
}
