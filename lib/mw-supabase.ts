import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Separate Supabase client for Meeting Whisperer auth.
 * Used to get JWTs that the MW backend will accept.
 * The dashboard's own Supabase handles login/profiles/dashboard data.
 */

const mwUrl = process.env.NEXT_PUBLIC_MW_SUPABASE_URL || '';
const mwKey = process.env.NEXT_PUBLIC_MW_SUPABASE_ANON_KEY || '';

let _mwClient: SupabaseClient | null = null;

export function getMWSupabase(): SupabaseClient | null {
  if (!mwUrl || !mwKey) return null;
  if (!_mwClient) {
    _mwClient = createBrowserClient(mwUrl, mwKey, {
      // Use a different storage key so it doesn't collide with the dashboard client
      cookieOptions: { name: 'mw-auth' },
    });
  }
  return _mwClient;
}

/**
 * Sign in to the MW Supabase with the same credentials.
 * Called during dashboard login so we have a valid MW JWT for API calls.
 */
export async function signInToMW(email: string, password: string): Promise<boolean> {
  const client = getMWSupabase();
  if (!client) return false;
  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get the MW access token for API Bearer auth.
 */
export async function getMWAccessToken(): Promise<string | null> {
  const client = getMWSupabase();
  if (!client) return null;
  try {
    const { data: { session } } = await client.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Sign out of MW Supabase (called when dashboard signs out).
 */
export async function signOutMW(): Promise<void> {
  const client = getMWSupabase();
  if (client) {
    await client.auth.signOut();
  }
}
