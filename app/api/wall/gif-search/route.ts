import { NextResponse, type NextRequest } from 'next/server';
import {
  getOrCreateAuthorCookieId,
  getClientIp,
  isIpBanned,
} from '@/lib/wallGuest';

export const dynamic = 'force-dynamic';

type TenorResult = {
  id: string;
  content_description?: string;
  itemurl?: string;
  url?: string;
  media_formats?: {
    gif?: { url: string; dims?: number[] };
    tinygif?: { url: string; dims?: number[] };
    gifpreview?: { url: string; dims?: number[] };
    nanogif?: { url: string; dims?: number[] };
  };
};

type PickerItem = {
  id: string;
  preview_url: string;
  share_url: string;
  description: string;
  width?: number;
  height?: number;
};

// In-memory rate limit per cookie id (serverless-scoped; best-effort).
const RATE_BUCKET = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 40;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = RATE_BUCKET.get(key);
  if (!entry || entry.resetAt < now) {
    RATE_BUCKET.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

// Short in-memory cache keyed by query to absorb duplicate searches.
const CACHE = new Map<string, { expires: number; items: PickerItem[] }>();
const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 128;

function cacheGet(key: string): PickerItem[] | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    CACHE.delete(key);
    return null;
  }
  return hit.items;
}

function cacheSet(key: string, items: PickerItem[]) {
  if (CACHE.size >= CACHE_MAX_ENTRIES) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
  CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, items });
}

function mapResults(results: TenorResult[]): PickerItem[] {
  return results
    .map((r): PickerItem | null => {
      const preview =
        r.media_formats?.tinygif ??
        r.media_formats?.nanogif ??
        r.media_formats?.gifpreview ??
        r.media_formats?.gif;
      const full = r.media_formats?.gif ?? preview;
      if (!preview?.url || !full?.url) return null;
      // Tenor share URLs look like: https://tenor.com/view/<slug>-<id>
      const share = r.itemurl || r.url || `https://tenor.com/view/-${r.id}`;
      const [w, h] = preview.dims ?? [];
      return {
        id: r.id,
        preview_url: preview.url,
        share_url: share,
        description: (r.content_description ?? 'GIF').slice(0, 140),
        width: w,
        height: h,
      };
    })
    .filter((x): x is PickerItem => x !== null);
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.TENOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GIF search is not configured' },
      { status: 503 },
    );
  }

  const ip = getClientIp(req);
  if (await isIpBanned(ip)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cookieId = await getOrCreateAuthorCookieId();
  if (!rateLimit(cookieId)) {
    return NextResponse.json(
      { error: 'Too many searches — slow down for a bit.' },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const rawQ = url.searchParams.get('q') ?? '';
  const q = rawQ.trim().slice(0, 80);
  const cacheKey = q.toLowerCase();
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json({ results: cached });

  const endpoint = new URL(
    q
      ? 'https://tenor.googleapis.com/v2/search'
      : 'https://tenor.googleapis.com/v2/featured',
  );
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('client_key', 'isla_wall');
  endpoint.searchParams.set('limit', '24');
  endpoint.searchParams.set('media_filter', 'gif,tinygif,nanogif,gifpreview');
  endpoint.searchParams.set('contentfilter', 'high'); // strictest kid-safe
  endpoint.searchParams.set('locale', 'en_US');
  if (q) endpoint.searchParams.set('q', q);

  try {
    const resp = await fetch(endpoint.toString(), {
      next: { revalidate: 60 },
    });
    if (!resp.ok) {
      console.error('[gif-search] tenor returned', resp.status);
      return NextResponse.json(
        { error: 'GIF search unavailable' },
        { status: 502 },
      );
    }
    const body = (await resp.json()) as { results?: TenorResult[] };
    const items = mapResults(body.results ?? []);
    cacheSet(cacheKey, items);
    return NextResponse.json({ results: items });
  } catch (err) {
    console.error('[gif-search] fetch failed', err);
    return NextResponse.json(
      { error: 'GIF search unavailable' },
      { status: 502 },
    );
  }
}
