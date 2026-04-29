"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cookie-based Supabase client for client components inside /admin.
 * Shares its session with the middleware + server clients.
 *
 * Throws if env vars are missing — the admin area is gated by
 * middleware so a misconfigured env should never reach here.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars are not configured");
  }
  return createBrowserClient(url, key);
}
