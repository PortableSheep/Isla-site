/**
 * Resolves a Supabase client appropriate for the current runtime context.
 *
 * `@supabase/ssr` is statically imported so Vercel's file tracer bundles it
 * into the serverless function. `next/headers` is loaded via a
 * `webpackIgnore`'d dynamic import so the literal `import('next/headers')`
 * survives bundling: Webpack won't try to resolve it (keeping it out of the
 * client bundle), Node resolves it at runtime on the server, and Vercel's
 * output file tracer picks up the string literal and ships the submodule
 * with the lambda.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { supabase as browserClient } from './supabase';

export async function getSbClient(): Promise<SupabaseClient> {
  if (typeof window !== 'undefined') {
    return browserClient;
  }
  const { cookies } = await import(/* webpackIgnore: true */ 'next/headers');
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {
            // Server Components cannot set cookies; middleware handles refresh.
          }
        },
      },
    }
  );
}



