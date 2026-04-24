/**
 * Server-only helper that records a single page view from the edge
 * middleware. Kept in its own module so the middleware stays readable.
 *
 * Runtime: edge (Next.js 16 middleware). Uses the service-role Supabase
 * key to bypass RLS — page_views has INSERT denied for anon/authenticated.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import {
  buildDailySalt,
  hashVisitor,
  isBot,
  parseDevice,
  respectsDoNotTrack,
  shouldTrackPath,
} from './analytics';

const SESSION_COOKIE = 'isla_sid';
const SESSION_MAX_AGE_SECONDS = 30 * 60;

let adminInstance: SupabaseClient | null = null;

function getEdgeAdminClient(): SupabaseClient | null {
  if (adminInstance) return adminInstance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  adminInstance = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Edge runtime ships with global fetch; no custom opts needed.
  });
  return adminInstance;
}

/**
 * Generate a v4 UUID using WebCrypto — available in the edge runtime.
 * Falls back to a manual constructor if `randomUUID` isn't present.
 */
function randomUUID(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  (c ?? (globalThis.crypto as Crypto)).getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Same-origin referrer check so we don't record internal navigations. */
function externalReferrer(referrer: string | null, requestUrl: string): string | null {
  if (!referrer) return null;
  try {
    const ref = new URL(referrer);
    const self = new URL(requestUrl);
    if (ref.host === self.host) return null;
    return ref.toString();
  } catch {
    return null;
  }
}

export interface RecordPageViewArgs {
  request: NextRequest;
  response: NextResponse;
  userId: string | null;
}

/**
 * Builds the page-view row and returns it alongside the (possibly new)
 * session id. The caller is responsible for actually persisting the row
 * via `insertPageView` — this split keeps `waitUntil` work minimal.
 */
export function buildPageViewContext({ request, response }: {
  request: NextRequest;
  response: NextResponse;
}): { sessionId: string; shouldRecord: boolean; skipReason?: string } {
  const { pathname } = request.nextUrl;

  if (!shouldTrackPath(pathname)) {
    return { sessionId: '', shouldRecord: false, skipReason: 'path' };
  }

  const dnt = request.headers.get('dnt');
  if (respectsDoNotTrack(dnt)) {
    return { sessionId: '', shouldRecord: false, skipReason: 'dnt' };
  }

  const ua = request.headers.get('user-agent');
  if (isBot(ua)) {
    return { sessionId: '', shouldRecord: false, skipReason: 'bot' };
  }

  // Sliding 30-min session cookie. Reissued on every tracked request to
  // extend the window; replaced only when missing.
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existing && /^[0-9a-f-]{36}$/i.test(existing) ? existing : randomUUID();
  response.cookies.set({
    name: SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { sessionId, shouldRecord: true };
}

export async function recordPageView({
  request,
  response,
  userId,
}: RecordPageViewArgs): Promise<void> {
  const ctx = buildPageViewContext({ request, response });
  if (!ctx.shouldRecord) return;

  const admin = getEdgeAdminClient();
  if (!admin) return; // Service key not configured — silently skip.

  const secret = process.env.ANALYTICS_SALT;
  if (!secret) return; // Refuse to hash without a salt.

  const ua = request.headers.get('user-agent');
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;

  const visitorHash = await hashVisitor(ip, ua, buildDailySalt(secret));

  const country = request.headers.get('x-vercel-ip-country') || null;
  const region = request.headers.get('x-vercel-ip-country-region') || null;
  const city = (() => {
    const raw = request.headers.get('x-vercel-ip-city');
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  const referrer = externalReferrer(request.headers.get('referer'), request.url);

  const row = {
    path: request.nextUrl.pathname,
    referrer,
    user_agent: ua,
    device_type: parseDevice(ua),
    country,
    region,
    city,
    visitor_hash: visitorHash,
    session_id: ctx.sessionId,
    user_id: userId,
  };

  const { error } = await admin.from('page_views').insert(row);
  if (error) {
    console.error('[analytics] insert failed:', error.message);
  }
}
