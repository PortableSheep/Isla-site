import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers.js';
import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

export const WALL_COOKIE_NAME = 'wall_author';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Read or lazily create the guest's long-lived author_cookie_id (UUID v4). */
export async function getOrCreateAuthorCookieId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(WALL_COOKIE_NAME)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;

  const id = randomUUID();
  store.set(WALL_COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return id;
}

/** Read the cookie without creating one. Useful for feed queries. */
export async function readAuthorCookieId(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(WALL_COOKIE_NAME)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  return null;
}

/**
 * Resolve the first trusted client IP for the request.
 *
 * Vercel sets x-forwarded-for with the client as the first hop. For other
 * deployments this is only safe if the runtime itself proxies.
 */
export function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

/** CSRF: only accept POSTs whose Origin/Referer matches our own host. */
export function isSameOriginWrite(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');
  if (!host) return false;

  const allowedHosts = new Set<string>([host]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      allowedHosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host);
    } catch {}
  }

  const check = (value: string | null) => {
    if (!value) return null;
    try {
      return allowedHosts.has(new URL(value).host);
    } catch {
      return false;
    }
  };

  const o = check(origin);
  if (o !== null) return o;
  // Some browsers omit Origin on same-origin GET→POST; fall back to Referer.
  const r = check(referer);
  if (r !== null) return r;
  return false;
}

/** Check ip_bans table via SECURITY DEFINER helper. */
export async function isIpBanned(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin.rpc('is_ip_banned', { addr: ip });
  if (error) {
    console.error('[wall] is_ip_banned rpc failed', error);
    return false;
  }
  return Boolean(data);
}

/** Per-bucket atomic rate limit. Returns true if the action is allowed. */
export async function checkRateLimit(
  bucket: 'post' | 'comment' | 'react',
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return true; // fail open if service role missing; avoid locking site out
  const { data, error } = await admin.rpc('rate_limit_check', {
    p_bucket: bucket,
    p_key: key,
    p_limit: limit,
    p_window: `${windowSeconds} seconds`,
  });
  if (error) {
    console.error('[wall] rate_limit_check rpc failed', error);
    return true;
  }
  return Boolean(data);
}

/** Resolve the family_id that all public-wall content attaches to. */
// Stable singleton: this site has exactly one family (Isla's). Env var can override
// for previews/staging, but production never needs configuring.
const DEFAULT_ISLA_FAMILY_ID = '5c03b0c0-3c65-4e9a-981a-3edd3dcb015c';

export function getIslaFamilyId(): string | null {
  return (
    process.env.NEXT_PUBLIC_ISLA_FAMILY_ID ||
    process.env.ISLA_FAMILY_ID ||
    DEFAULT_ISLA_FAMILY_ID
  );
}

export type GuestContext = {
  cookieId: string;
  ip: string | null;
  userAgent: string | null;
};

/** Build a fresh guest context for a write request. */
export async function resolveGuest(req: NextRequest): Promise<GuestContext> {
  return {
    cookieId: await getOrCreateAuthorCookieId(),
    ip: getClientIp(req),
    userAgent: req.headers.get('user-agent'),
  };
}
