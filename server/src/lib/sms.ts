import { env } from '../env.js';

export interface SmsResult {
  delivered: boolean;
  provider: string;
  detail?: string;
}

/**
 * Sends the one-time code. `console` (the default) prints the code to the
 * server log so the platform is usable before an SMS contract is in place;
 * set SMS_PROVIDER=kavenegar|smsir plus SMS_API_KEY to send real messages.
 */
export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const text = `کد ورود شما به نوآفر: ${code}\nاین کد تا ${Math.round(
    env.otpTtlSeconds / 60,
  )} دقیقه معتبر است.`;

  switch (env.smsProvider) {
    case 'kavenegar':
      return sendViaKavenegar(phone, code, text);
    case 'smsir':
      return sendViaSmsIr(phone, code);
    case 'console':
    default:
      // eslint-disable-next-line no-console
      console.info(`[noafar][otp] کد ورود برای ${maskPhone(phone)} → ${code}`);
      return { delivered: true, provider: 'console' };
  }
}

function maskPhone(phone: string): string {
  return phone.length > 6 ? `${phone.slice(0, 4)}***${phone.slice(-3)}` : phone;
}

async function sendViaKavenegar(phone: string, code: string, text: string): Promise<SmsResult> {
  if (!env.smsApiKey) {
    return { delivered: false, provider: 'kavenegar', detail: 'SMS_API_KEY تنظیم نشده است.' };
  }

  // A verification template (SMS_TEMPLATE) uses the OTP-specific endpoint,
  // which is the only one Iranian operators deliver reliably for login codes.
  const url = env.smsTemplate
    ? `https://api.kavenegar.com/v1/${encodeURIComponent(env.smsApiKey)}/verify/lookup.json` +
      `?receptor=${encodeURIComponent(phone)}&token=${encodeURIComponent(code)}` +
      `&template=${encodeURIComponent(env.smsTemplate)}`
    : `https://api.kavenegar.com/v1/${encodeURIComponent(env.smsApiKey)}/sms/send.json` +
      `?receptor=${encodeURIComponent(phone)}&message=${encodeURIComponent(text)}` +
      (env.smsSender ? `&sender=${encodeURIComponent(env.smsSender)}` : '');

  return callProvider('kavenegar', url, { method: 'GET' });
}

async function sendViaSmsIr(phone: string, code: string): Promise<SmsResult> {
  if (!env.smsApiKey || !env.smsTemplate) {
    return {
      delivered: false,
      provider: 'smsir',
      detail: 'برای sms.ir هر دو مقدار SMS_API_KEY و SMS_TEMPLATE لازم است.',
    };
  }

  return callProvider('smsir', 'https://api.sms.ir/v1/send/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-api-key': env.smsApiKey },
    body: JSON.stringify({
      mobile: phone,
      templateId: Number(env.smsTemplate),
      parameters: [{ name: 'CODE', value: code }],
    }),
  });
}

async function callProvider(provider: string, url: string, init: RequestInit): Promise<SmsResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      // eslint-disable-next-line no-console
      console.error(`[noafar][sms] ${provider} پاسخ ${response.status} داد: ${detail}`);
      return { delivered: false, provider, detail };
    }
    return { delivered: true, provider };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`[noafar][sms] ارسال پیامک با ${provider} شکست خورد: ${detail}`);
    return { delivered: false, provider, detail };
  } finally {
    clearTimeout(timeout);
  }
}
