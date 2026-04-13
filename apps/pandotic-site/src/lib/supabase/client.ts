import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Create a Supabase client for server-side static generation.
 * Uses the anon key for public read access (RLS allows SELECT on published projects).
 * Returns null if env vars are not set (falls back to filesystem data).
 */
export function createClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  cachedClient = createSupabaseClient(url, key);
  return cachedClient;
}
