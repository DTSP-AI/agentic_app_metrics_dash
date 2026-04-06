import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function canCreateClient(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export function createClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!canCreateClient()) {
    // During Next.js build/prerender, env vars may be missing.
    // Return a stub that won't crash but also won't work.
    return new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
            signOut: () => Promise.resolve({ error: null }),
          };
        }
        return () => {};
      },
    });
  }

  if (!_client) {
    _client = createClient();
  }
  return _client;
}
