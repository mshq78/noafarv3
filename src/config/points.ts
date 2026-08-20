import { PointEntry } from '../types';

export const POINT_REASONS_FA: Record<PointEntry['reason'], { label: string; points: number }> = {
  like: { label: 'پسندیدن محتوا', points: 5 },
  comment: { label: 'ثبت دیدگاه معتبر', points: 15 },
  bookmark: { label: 'ذخیره محتوا در پروفایل', points: 5 },
  share: { label: 'اشتراک‌گذاری با دیگران', points: 10 },
  submit_idea: { label: 'ثبت ایده نوآورانه', points: 50 },
  submit_experience: { label: 'ثبت تجربه زیسته اجتماعی', points: 100 },
  complete_profile: { label: 'تکمیل اطلاعات حساب کاربری', points: 20 },
  complete_course: { label: 'تکمیل و مشاهده کامل دوره', points: 40 },
  first_canvas: { label: 'ساخت اولین بوم دیجیتال', points: 30 },
};

export const POINT_CONFIGS = POINT_REASONS_FA;
