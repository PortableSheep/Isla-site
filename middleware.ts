import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { recordPageView } from '@/lib/analyticsCapture';

/**
 * Refresh the Supabase session on every request so that both browser and
 * server see the same (fresh) auth state. Based on the official Supabase
 * SSR guide for Next.js.
 *
 * Also records a page view row for homegrown analytics (admin-only
 * dashboard at /admin/analytics). Recording runs via `event.waitUntil`
 * so it never delays the response and failures are swallowed — analytics
 * must never break the user-visible request path.
 */

// ---------------------------------------------------------------------------
// Maintenance mode cache — checked at most once every 30 seconds so we don't
// hit the database on every single request while still reacting quickly to
// admin toggles. Falls back to the MAINTENANCE_MODE env var when the DB is
// unavailable.
// ---------------------------------------------------------------------------
let maintenanceCacheValue = false;
let maintenanceCacheExpiry = 0;
const MAINTENANCE_CACHE_TTL_MS = 30_000;

async function isMaintenanceMode(): Promise<boolean> {
  // Fast path: env var override (legacy / emergency).
  if (process.env.MAINTENANCE_MODE === 'true') return true;

  const now = Date.now();
  if (now < maintenanceCacheExpiry) return maintenanceCacheValue;

  // Refresh from DB using the service-role client (anon policy allows SELECT).
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return false;
    const res = await fetch(
      `${url}/rest/v1/site_settings?key=eq.maintenance_mode&select=value`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
    );
    if (res.ok) {
      const rows: Array<{ value: string }> = await res.json();
      maintenanceCacheValue = rows[0]?.value === 'true';
    }
  } catch {
    // Leave cached value unchanged on error.
  }
  maintenanceCacheExpiry = Date.now() + MAINTENANCE_CACHE_TTL_MS;
  return maintenanceCacheValue;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Maintenance mode: redirect all non-exempt traffic to /maintenance.
  // Controlled via admin panel (site_settings table) or MAINTENANCE_MODE env var.
  const { pathname } = request.nextUrl;
  const maintenanceExempt =
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next/');

  if (!maintenanceExempt && (await isMaintenanceMode())) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: this triggers session refresh + cookie rewrites
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fire-and-forget page view capture. `recordPageView` also sets the
  // sliding session cookie on `response` synchronously before awaiting
  // the DB write, so the cookie is attached even if waitUntil is slow.
  try {
    const capture = recordPageView({
      request,
      response,
      userId: user?.id ?? null,
    }).catch((err) => {
      console.error('[analytics] capture failed:', err);
    });
    event.waitUntil(capture);
  } catch (err) {
    console.error('[analytics] capture scheduling failed:', err);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static, _next/image, favicon/public assets
     *  - any path with a file extension (images, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
