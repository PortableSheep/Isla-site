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
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Maintenance mode: set MAINTENANCE_MODE=true in env vars to redirect all
  // non-exempt traffic to /maintenance. Admins can still reach /api and /auth.
  if (process.env.MAINTENANCE_MODE === 'true') {
    const { pathname } = request.nextUrl;
    const exempt =
      pathname.startsWith('/maintenance') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next/');
    if (!exempt) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
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
