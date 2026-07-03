import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client using service_role key.
// Creates a fresh client on each call so hot-reloads pick up env changes.
// This file must NEVER be imported from client components.

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey ||
      supabaseUrl === 'PASTE_YOUR_SUPABASE_URL_HERE') {
    throw new Error(
      'Missing Supabase env vars. Fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart the dev server.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Named export used across all API routes
export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
  rpc:  (fn: string, args?: Record<string, unknown>) => getSupabaseAdmin().rpc(fn, args),
};
