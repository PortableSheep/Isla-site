/**
 * Analytics helpers shared between the edge middleware (capture) and the
 * admin summary API (read). Pure, side-effect-free functions so they're
 * easy to unit test and safe to import from any runtime.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

/** Common bot / crawler user-agents we don't want polluting the stats. */
const BOT_UA_RE =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|W3C_Validator|fetch|headless|lighthouse|gtmetrix|pagespeed|preview|monitoring|uptime|wget|curl|python-requests|go-http-client|axios|node-fetch/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_UA_RE.test(userAgent);
}

export function parseDevice(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return 'unknown';
  if (isBot(userAgent)) return 'bot';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android.+mobile|phone|blackberry|iemobile|opera mini/.test(ua)) {
    // Android devices without the "Mobile" token are typically tablets.
    return 'mobile';
  }
  if (/android/.test(ua)) return 'tablet';
  return 'desktop';
}

/** Current UTC date as YYYY-MM-DD — used to rotate the visitor hash daily. */
export function dailySaltDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Build the salt used to hash a visitor. We combine a server-side secret
 * (`ANALYTICS_SALT`) with today's date so the hash rotates every day —
 * a visitor is recognizable within a day (for unique-visitor counts) but
 * not across days (so we can't build a long-term profile from the hash).
 */
export function buildDailySalt(secret: string, now: Date = new Date()): string {
  return `${secret}|${dailySaltDate(now)}`;
}

/**
 * SHA-256 hex digest using the WebCrypto API (available in both the edge
 * runtime and Node 20+). Returns the full 64-char hex string.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashVisitor(
  ip: string | null | undefined,
  userAgent: string | null | undefined,
  salt: string,
): Promise<string> {
  const safeIp = ip ?? 'unknown-ip';
  const safeUa = userAgent ?? 'unknown-ua';
  return sha256Hex(`${safeIp}|${safeUa}|${salt}`);
}

/**
 * Paths we never want to record a page view for, even though middleware
 * may still run on them. API routes are excluded at the matcher level,
 * but belt-and-suspenders.
 */
const SKIP_PATH_RE = /^\/(api|_next|favicon|robots\.txt|sitemap\.xml|manifest\.json)/;

export function shouldTrackPath(pathname: string): boolean {
  return !SKIP_PATH_RE.test(pathname);
}

/** Honor the `DNT: 1` Do-Not-Track signal. */
export function respectsDoNotTrack(dntHeader: string | null | undefined): boolean {
  return dntHeader === '1';
}
