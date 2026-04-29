"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cookie-based Supabase client for client components inside /admin.
 * Shares its session with the middleware + server clients.
 *
 * Uses placeholder credentials when NEXT_PUBLIC_SUPABASE_URL or
 * NEXT_PUBLIC_SUPABASE_ANON_KEY is unset — required so Next.js static
 * prerender (output:'export') doesn't crash on builds without those env
 * vars (notably Netlify deploy previews, which don't inherit production
 * env scope). The placeholder client never reaches a real backend; any
 * call against it fails network-side, which is the correct UX for a
 * misconfigured deploy.
 */
export function createSupabaseBrowserClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";
  return createBrowserClient(url, key);
}
