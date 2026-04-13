import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for browser/client-side usage.
 * This client handles cookie-based authentication via @supabase/ssr.
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
