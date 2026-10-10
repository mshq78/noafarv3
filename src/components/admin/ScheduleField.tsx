import React from 'react';
import { CalendarClock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { toFaDigits } from '../../utils/format';
import {
  JALALI_MONTHS,
  formatIranDateTime,
  fromIranDateTime,
  jalaliMonthLength,
  toIranDateTime,
  type IranDateTime,
} from '../../utils/jalali';

interface ScheduleFieldProps {
  value: IranDateTime;
  onChange: (next: IranDateTime) => void;
  disabled?: boolean;
}

const selectClass =
  'h-10 px-2 bg-white border border-ink-200 rounded-lg text-ink-900 text-sm focus:outline-none focus:border-sky-600 disabled:opacity-50';

/**
 * Picks a publication moment in Jalali dates and Iran time. A free-text date
 * invites a typo that publishes a month early, so each part is a choice, and the
 * result is spelled out underneath ("۱۴۰۵/۰۷/۲۰ — ۰۹:۳۰ به وقت ایران") together
 * with how far away it is, so the editor reads back what they are about to commit.
 */
export const ScheduleField: React.FC<ScheduleFieldProps> = ({ value, onChange, disabled }) => {
  const now = toIranDateTime(Date.now());
  const years = Array.from(new Set([now.jy, now.jy + 1, now.jy + 2, value.jy])).sort((a, b) => a - b);
  const monthLength = jalaliMonthLength(value.jy, value.jm);
  const days = Array.from({ length: monthLength }, (_, i) => i + 1);
  const two = (n: number) => String(n).padStart(2, '0');

  // A change of month or year can leave the day past the new month's end.
  const set = (patch: Partial<IranDateTime>) => {
    const next = { ...value, ...patch };
    next.jd = Math.min(next.jd, jalaliMonthLength(next.jy, next.jm));
    onChange(next);
  };

  const target = fromIranDateTime(value);
  const minutesAhead = Math.round((target.getTime() - Date.now()) / 60_000);
  const isPast = minutesAhead < 1;
  const daysAhead = Math.floor(minutesAhead / 1440);
  const hoursAhead = Math.floor((minutesAhead % 1440) / 60);
  const distance = isPast
    ? 'این زمان گذشته است'
    : daysAhead > 0
      ? `حدود ${toFaDigits(daysAhead)} روز و ${toFaDigits(hoursAhead)} ساعت دیگر`
      : hoursAhead > 0
        ? `حدود ${toFaDigits(hoursAhead)} ساعت دیگر`
        : `${toFaDigits(minutesAhead)} دقیقه دیگر`;

  return (
    <div className="space-y-2 p-3 bg-sky-50/60 border border-sky-200 rounded-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-sky-800">
        <CalendarClock className="w-4 h-4" />
        زمان انتشار (تاریخ شمسی، به وقت ایران)
      </div>

      <div className="flex flex-wrap items-center gap-2" dir="rtl">
        <select
          aria-label="سال"
          className={selectClass}
          value={value.jy}
          disabled={disabled}
          onChange={(e) => set({ jy: Number(e.target.value) })}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {toFaDigits(y)}
            </option>
          ))}
        </select>
        <select
          aria-label="ماه"
          className={selectClass}
          value={value.jm}
          disabled={disabled}
          onChange={(e) => set({ jm: Number(e.target.value) })}
        >
          {JALALI_MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="روز"
          className={selectClass}
          value={value.jd}
          disabled={disabled}
          onChange={(e) => set({ jd: Number(e.target.value) })}
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {toFaDigits(d)}
            </option>
          ))}
        </select>
        <span className="text-ink-400 text-sm">ساعت</span>
        <input
          type="time"
          aria-label="ساعت و دقیقه"
          dir="ltr"
          disabled={disabled}
          value={`${two(value.hour)}:${two(value.minute)}`}
          onChange={(e) => {
            const [h, m] = e.target.value.split(':').map(Number);
            if (Number.isFinite(h) && Number.isFinite(m)) set({ hour: h!, minute: m! });
          }}
          className={cn(selectClass, 'font-sans')}
        />
      </div>

      <p className={cn('text-xs font-medium', isPast ? 'text-pink-600' : 'text-ink-600')} role="status">
        {formatIranDateTime(target)} به وقت ایران — {distance}
      </p>
    </div>
  );
};
