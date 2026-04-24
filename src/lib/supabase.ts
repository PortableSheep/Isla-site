import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Browser-side Supabase client. Session is stored in cookies (not localStorage)
 * so that server-side route handlers and middleware can read it.
 */
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Return a placeholder that will never be invoked in server contexts.
    // Server code must use createClient() from @/lib/supabaseServer instead.
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          '[supabase] The browser client was used on the server. Import createClient from @/lib/supabaseServer in route handlers and server components.'
        );
      },
    });
  }

  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Missing Supabase environment variables - auth will not work');
  }

  supabaseInstance = createBrowserClient(
    url || 'https://placeholder.supabase.co',
    anonKey || 'placeholder'
  );
  return supabaseInstance;
})();

