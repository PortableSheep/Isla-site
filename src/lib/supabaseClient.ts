/**
 * Resolves a Supabase client appropriate for the current runtime context.
 *
 * `@supabase/ssr` is statically imported so Vercel's file tracer bundles it
 * into the serverless function. Only `next/headers` is loaded via indirect
 * `eval()`-ed dynamic import, because it is server-only and would otherwise
 * error when this file is pulled into a client bundle.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { supabase as browserClient } from './supabase';

// Indirect eval produces a dynamic import that the bundler can't trace,
// keeping `next/headers` out of the client bundle.
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
const dynImport: (specifier: string) => Promise<any> = (0, eval)(
  '(s) => import(s)'
);

export async function getSbClient(): Promise<SupabaseClient> {
  if (typeof window !== 'undefined') {
    return browserClient;
  }
  const { cookies } = await dynImport('next/headers');
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



