import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn('[email] RESEND_API_KEY is not set — outbound emails will be logged only.');
}

const resendClient = apiKey ? new Resend(apiKey) : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ||
  'Isla Zone <noreply@islazone.app>';

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!resendClient) {
    console.log('[email:skipped]', { to: params.to, subject: params.subject });
    return { ok: true, skipped: true };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    });

    if (error) {
      console.error('[email:error]', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[email:exception]', message);
    return { ok: false, error: message };
  }
}
