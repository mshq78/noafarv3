import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { describeValidationIssues } from '../server/src/lib/http.ts';
import { normalizePersianText } from '../server/src/lib/content.ts';

test('validation issues name the field and are Persian, not zod defaults', () => {
  const r = z.object({ title: z.string().min(2), tags: z.array(z.string()).max(1) }).safeParse({ title: 'a', tags: ['x', 'y'] });
  assert.ok(!r.success);
  const text = describeValidationIssues(r.error.issues);
  assert.match(text, /«عنوان»: حداقل ۲ نویسه لازم است/);
  assert.match(text, /«کلیدواژه‌ها»: بیش از ۱ مورد مجاز نیست/);
  assert.doesNotMatch(text, /Too small|expected/i);
});

test('a message the schema already wrote in Persian is kept', () => {
  const r = z.object({ name: z.string().min(2, 'نام باید حداقل ۲ نویسه باشد') }).safeParse({ name: 'ا' });
  assert.ok(!r.success);
  assert.equal(describeValidationIssues(r.error.issues), '«نام»: نام باید حداقل ۲ نویسه باشد');
});

test('Arabic ي ى ك are folded to the Persian letters', () => {
  assert.equal(normalizePersianText('كتاب يك'), 'کتاب یک');
  assert.equal(normalizePersianText('على'), 'علی');
  assert.equal(normalizePersianText('کتاب'), 'کتاب');
});

test('a missing field is reported as required', () => {
  const r = z.object({ phone: z.string() }).safeParse({});
  assert.ok(!r.success);
  assert.equal(describeValidationIssues(r.error.issues), '«راه ارتباطی»: الزامی است');
});
