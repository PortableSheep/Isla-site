/**
 * Resolves a Supabase client appropriate for the current runtime context.
 *
 * The server path (`next/headers`, `@supabase/ssr` createServerClient) is
 * loaded via indirect eval'd `import()` so that Next/Turbopack cannot
 * statically trace the server-only modules into the client bundle when
 * library helpers are shared between client and server code.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as browserClient } from './supabase';

// Indirect eval produces a dynamic import that the bundler can't trace.
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
const dynImport: (specifier: string) => Promise<any> = (0, eval)(
  '(s) => import(s)'
);

export async function getSbClient(): Promise<SupabaseClient> {
  if (typeof window !== 'undefined') {
    return browserClient;
  }
  const [{ createServerClient }, { cookies }] = await Promise.all([
    dynImport('@supabase/ssr'),
    dynImport('next/headers'),
  ]);
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



