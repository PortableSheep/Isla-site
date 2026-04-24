import { NextResponse, type NextRequest } from 'next/server';
import {
  getOrCreateAuthorCookieId,
  getClientIp,
  isIpBanned,
} from '@/lib/wallGuest';

export const dynamic = 'force-dynamic';

// Giphy GIF object (subset we use). See: https://developers.giphy.com/docs/api/schema
type GiphyImageVariant = {
  url?: string;
  width?: string;
  height?: string;
};

type GiphyResult = {
  id: string;
  url?: string;
  title?: string;
  alt_text?: string;
  images?: {
    fixed_width_small?: GiphyImageVariant;
    fixed_height_small?: GiphyImageVariant;
    fixed_width?: GiphyImageVariant;
    fixed_height?: GiphyImageVariant;
    downsized?: GiphyImageVariant;
    preview_gif?: GiphyImageVariant;
    original?: GiphyImageVariant;
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

function parseDim(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function mapResults(results: GiphyResult[]): PickerItem[] {
  return results
    .map((r): PickerItem | null => {
      const img = r.images ?? {};
      const preview =
        img.fixed_width_small ??
        img.fixed_height_small ??
        img.preview_gif ??
        img.fixed_width ??
        img.fixed_height ??
        img.downsized ??
        img.original;
      if (!preview?.url || !r.url || !r.id) return null;
      return {
        id: r.id,
        preview_url: preview.url,
        // Giphy share URL form: https://giphy.com/gifs/<slug>-<id> (sometimes slugless).
        share_url: r.url,
        description: (r.title || r.alt_text || 'GIF').slice(0, 140),
        width: parseDim(preview.width),
        height: parseDim(preview.height),
      };
    })
    .filter((x): x is PickerItem => x !== null);
}

export async function GET(req: NextRequest) {
  // Prefer GIPHY_API_KEY; accept legacy TENOR_API_KEY during transition so
  // environments only set up with the old name don't immediately break. The
  // Tenor key won't actually work against Giphy, but the UI will surface the
  // 502 instead of the 503-not-configured state — signalling to ops that the
  // env var needs renaming.
  const apiKey = process.env.GIPHY_API_KEY ?? process.env.TENOR_API_KEY;
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
      ? 'https://api.giphy.com/v1/gifs/search'
      : 'https://api.giphy.com/v1/gifs/trending',
  );
  endpoint.searchParams.set('api_key', apiKey);
  endpoint.searchParams.set('limit', '24');
  // rating=g is the strictest kid-safe filter. Always enforced server-side;
  // anything the client supplied is ignored.
  endpoint.searchParams.set('rating', 'g');
  endpoint.searchParams.set('lang', 'en');
  endpoint.searchParams.set('bundle', 'messaging_non_clips');
  if (q) endpoint.searchParams.set('q', q);

  try {
    const resp = await fetch(endpoint.toString(), {
      next: { revalidate: 60 },
    });
    if (!resp.ok) {
      console.error('[gif-search] giphy returned', resp.status);
      return NextResponse.json(
        { error: 'GIF search unavailable' },
        { status: 502 },
      );
    }
    const body = (await resp.json()) as { data?: GiphyResult[] };
    const items = mapResults(body.data ?? []);
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
