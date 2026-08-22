import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../env.js';

export interface MailResult {
  delivered: boolean;
  provider: string;
  detail?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!env.smtpHost) return null;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    // Port 465 is implicit TLS; everything else upgrades with STARTTLS.
    secure: env.smtpSecure ?? env.smtpPort === 465,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends transactional mail. With no SMTP host configured the message is
 * printed to the server log, so password reset is usable before a mail
 * contract is in place — the same fallback the SMS sender uses.
 */
export async function sendMail({ to, subject, text, html }: MailInput): Promise<MailResult> {
  const transport = getTransporter();

  if (!transport) {
    // eslint-disable-next-line no-console
    console.info(`[noafar][mail] برای ${maskEmail(to)} — ${subject}\n${text}`);
    return { delivered: true, provider: 'console' };
  }

  try {
    await transport.sendMail({ from: env.mailFrom || env.smtpUser, to, subject, text, html });
    return { delivered: true, provider: 'smtp' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`[noafar][mail] ارسال رایانامه ناموفق بود: ${detail}`);
    return { delivered: false, provider: 'smtp', detail };
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

/** The password-reset message, in the site's own voice. */
export function buildPasswordResetMail(resetUrl: string, minutes: number) {
  const text = [
    'سلام،',
    '',
    'برای تعیین گذرواژه تازه حساب کاربری خود در نوآفر، نشانی زیر را باز کنید:',
    resetUrl,
    '',
    `این پیوند تا ${minutes} دقیقه معتبر است و تنها یک‌بار قابل استفاده است.`,
    'اگر شما درخواست بازیابی گذرواژه نداده‌اید، این پیام را نادیده بگیرید.',
    '',
    'با احترام،',
    'دبیرخانه نوآفر',
  ].join('\n');

  const html = `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:2;color:#2e2e2e">
      <p>سلام،</p>
      <p>برای تعیین گذرواژه تازه حساب کاربری خود در نوآفر روی دکمه زیر بزنید:</p>
      <p>
        <a href="${escapeHtml(resetUrl)}"
           style="display:inline-block;padding:10px 20px;background:#0284c7;color:#fff;
                  border-radius:12px;text-decoration:none;font-weight:bold">
          تعیین گذرواژه تازه
        </a>
      </p>
      <p style="font-size:13px;color:#6b6b6b">
        این پیوند تا ${minutes} دقیقه معتبر است و تنها یک‌بار قابل استفاده است.<br />
        اگر شما درخواست بازیابی گذرواژه نداده‌اید، این پیام را نادیده بگیرید.
      </p>
      <p style="font-size:13px;color:#6b6b6b">دبیرخانه نوآفر</p>
    </div>`;

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
