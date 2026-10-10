import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromIranDateTime, gregorianToJalali, jalaliMonthLength, jalaliToGregorian, toIranDateTime } from '../src/utils/jalali.ts';

// The platform's own Persian calendar is the reference.
const icu = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });

test('Jalali conversion matches ICU for every day 1990-2060, both directions', () => {
  for (let t = Date.UTC(1990, 0, 1); t <= Date.UTC(2060, 11, 31); t += 86_400_000) {
    const d = new Date(t);
    const p = Object.fromEntries(icu.formatToParts(d).map((x) => [x.type, Number(x.value)]));
    assert.deepEqual(gregorianToJalali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), { jy: p.year, jm: p.month, jd: p.day });
    assert.deepEqual(jalaliToGregorian(p.year!, p.month!, p.day!), { gy: d.getUTCFullYear(), gm: d.getUTCMonth() + 1, gd: d.getUTCDate() });
  }
});

test('month lengths: first six 31, next five 30, Esfand 29 or 30', () => {
  assert.equal(jalaliMonthLength(1405, 1), 31);
  assert.equal(jalaliMonthLength(1405, 7), 30);
  assert.equal(jalaliMonthLength(1403, 12), 30); // leap
  assert.equal(jalaliMonthLength(1404, 12), 29);
});

test('Iran time round-trips and is UTC+3:30', () => {
  const at = fromIranDateTime({ jy: 1406, jm: 1, jd: 15, hour: 10, minute: 30 });
  assert.equal(at.toISOString(), '2027-04-04T07:00:00.000Z');
  assert.deepEqual(toIranDateTime(at), { jy: 1406, jm: 1, jd: 15, hour: 10, minute: 30 });
  // 23:45 in Tehran is still the previous day in UTC
  const late = fromIranDateTime({ jy: 1405, jm: 7, jd: 20, hour: 23, minute: 45 });
  assert.equal(late.toISOString(), '2026-10-12T20:15:00.000Z');
});
