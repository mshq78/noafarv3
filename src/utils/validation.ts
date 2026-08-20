import { z } from 'zod';

export const phoneSchema = z.string()
  .regex(/^09\d{9}$/, { message: 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹)' });

export const otpSchema = z.string()
  .length(5, { message: 'کد تایید باید ۵ رقم باشد' })
  .regex(/^\d{5}$/, { message: 'کد تایید باید فقط شامل ارقام باشد' });

export const ideaFormSchema = z.object({
  title: z.string().min(5, { message: 'عنوان ایده باید حداقل ۵ نویسه باشد' }),
  fieldSlug: z.string().min(1, { message: 'لطفاً دسته‌بندی موضوعی را انتخاب کنید' }),
  body: z.string().min(100, { message: 'متن ایده باید حداقل شامل ۱۰۰ نویسه توضیح باشد' }),
  tags: z.array(z.string()).default([]),
  attachment: z.any().optional(),
});

export type IdeaFormValues = z.infer<typeof ideaFormSchema>;

export const experienceFormSchema = z.object({
  title: z.string().min(5, { message: 'عنوان تجربه باید حداقل ۵ نویسه باشد' }),
  fieldSlug: z.string().min(1, { message: 'لطفاً دسته‌بندی موضوعی را انتخاب کنید' }),
  year: z.number().min(1380, { message: 'سال معتبر نیست' }).max(1405, { message: 'سال معتبر نیست' }),
  summary: z.string().min(20, { message: 'خلاصه باید حداقل ۲۰ نویسه باشد' }).max(300, { message: 'خلاصه نمی‌تواند بیش از ۳۰۰ نویسه باشد' }),
  startingPoint: z.string().min(30, { message: 'توضیح نقطه شروع باید حداقل ۳۰ نویسه باشد' }),
  path: z.string().min(50, { message: 'توضیح مسیر طی شده باید حداقل ۵۰ نویسه باشد' }),
  challenges: z.string().min(30, { message: 'توضیح چالش‌ها باید حداقل ۳۰ نویسه باشد' }),
  outcome: z.string().min(30, { message: 'توضیح نتیجه و درس‌آموخته‌ها باید حداقل ۳۰ نویسه باشد' }),
  image: z.any().refine((val) => val !== null && val !== undefined && val !== '', {
    message: 'بارگذاری تصویر اصلی تجربه الزامی است',
  }),
  tags: z.array(z.string()).default([]),
  additionalMedia: z.any().optional(),
});

export type ExperienceFormValues = z.infer<typeof experienceFormSchema>;

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'نام باید حداقل ۲ نویسه باشد' }),
  phone: phoneSchema,
  message: z.string().min(10, { message: 'پیام باید حداقل ۱۰ نویسه باشد' }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
