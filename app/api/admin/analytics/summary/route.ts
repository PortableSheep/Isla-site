import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type TimeframeKey = '24h' | '7d' | '30d' | '90d';

const TIMEFRAMES: Record<TimeframeKey, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

interface PageViewRow {
  created_at: string;
  path: string;
  referrer: string | null;
  device_type: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  visitor_hash: string;
  session_id: string;
  user_id: string | null;
}

function sinceIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function topN<T extends string>(counts: Map<T, number>, n: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function bucketByDay(rows: PageViewRow[], days: number) {
  const buckets = new Map<string, { date: string; views: number; visitors: Set<string> }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, views: 0, visitors: new Set() });
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.views += 1;
    bucket.visitors.add(row.visitor_hash);
  }
  return [...buckets.values()].map((b) => ({
    date: b.date,
    views: b.views,
    visitors: b.visitors.size,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', {
      uid: user.id,
    });
    if (isAdminError || isAdminData !== true) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tfParam = (request.nextUrl.searchParams.get('timeframe') || '30d') as TimeframeKey;
    const days = TIMEFRAMES[tfParam] ?? 30;
    const since = sinceIso(days);

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Analytics unavailable: service role key not configured.' },
        { status: 503 },
      );
    }

    // Fetch the window. 50k row cap keeps this endpoint responsive; once
    // we outgrow it we'll swap to SQL-side aggregation or a rollup table.
    const { data, error } = await admin
      .from('page_views')
      .select(
        'created_at, path, referrer, device_type, country, region, city, visitor_hash, session_id, user_id',
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50000);

    if (error) {
      console.error('[analytics] read failed:', error);
      return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
    }

    const rows = (data ?? []) as PageViewRow[];

    const totals = {
      views: rows.length,
      visitors: new Set(rows.map((r) => r.visitor_hash)).size,
      sessions: new Set(rows.map((r) => r.session_id)).size,
      loggedInViews: rows.filter((r) => r.user_id).length,
    };

    const pathCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const regionCounts = new Map<string, number>();
    const cityCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();

    for (const row of rows) {
      pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
      if (row.referrer) {
        try {
          const host = new URL(row.referrer).hostname;
          referrerCounts.set(host, (referrerCounts.get(host) ?? 0) + 1);
        } catch {
          referrerCounts.set(row.referrer, (referrerCounts.get(row.referrer) ?? 0) + 1);
        }
      }
      if (row.country) {
        countryCounts.set(row.country, (countryCounts.get(row.country) ?? 0) + 1);
      }
      if (row.region) {
        const key = `${row.country ?? '??'} / ${row.region}`;
        regionCounts.set(key, (regionCounts.get(key) ?? 0) + 1);
      }
      if (row.city) {
        const key = `${row.city}, ${row.region ?? '??'} (${row.country ?? '??'})`;
        cityCounts.set(key, (cityCounts.get(key) ?? 0) + 1);
      }
      const dev = row.device_type ?? 'unknown';
      deviceCounts.set(dev, (deviceCounts.get(dev) ?? 0) + 1);
    }

    // 24h totals shown as a "today" card regardless of selected timeframe.
    const last24 = rows.filter(
      (r) => new Date(r.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000,
    );
    const totals24h = {
      views: last24.length,
      visitors: new Set(last24.map((r) => r.visitor_hash)).size,
    };

    return NextResponse.json({
      timeframe: tfParam,
      days,
      generatedAt: new Date().toISOString(),
      totals,
      totals24h,
      timeseries: bucketByDay(rows, days),
      topPaths: topN(pathCounts, 10),
      topReferrers: topN(referrerCounts, 10),
      topCountries: topN(countryCounts, 10),
      topRegions: topN(regionCounts, 10),
      topCities: topN(cityCounts, 15),
      devices: topN(deviceCounts, 10),
      truncated: rows.length >= 50000,
    });
  } catch (err) {
    console.error('[analytics] summary error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
