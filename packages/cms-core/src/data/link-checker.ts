import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LinkCheck {
  id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  status_code: number | null;
  is_internal: boolean;
  is_broken: boolean;
  redirect_target: string | null;
  last_checked_at: string;
  first_broken_at: string | null;
  created_at: string;
}

export interface NotFoundLog {
  id: string;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  count: number;
  first_seen_at: string;
  last_seen_at: string;
}

// ---------------------------------------------------------------------------
// link_checks
// ---------------------------------------------------------------------------

export async function recordLinkCheck(
  client: SupabaseClient,
  entry: {
    source_url: string;
    target_url: string;
    anchor_text?: string | null;
    status_code?: number | null;
    is_internal?: boolean;
    is_broken?: boolean;
    redirect_target?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const isBroken = entry.is_broken ?? false;

  // Build the upsert payload
  const payload: Record<string, unknown> = {
    source_url: entry.source_url,
    target_url: entry.target_url,
    anchor_text: entry.anchor_text ?? null,
    status_code: entry.status_code ?? null,
    is_internal: entry.is_internal ?? true,
    is_broken: isBroken,
    redirect_target: entry.redirect_target ?? null,
    last_checked_at: now,
  };

  const { data: existing } = await client
    .from("link_checks")
    .select("id, is_broken, first_broken_at")
    .eq("source_url", entry.source_url)
    .eq("target_url", entry.target_url)
    .single();

  if (existing) {
    const updates: Record<string, unknown> = { ...payload };
    if (isBroken && !existing.first_broken_at) {
      updates.first_broken_at = now;
    } else if (!isBroken) {
      updates.first_broken_at = null;
    }
    await client.from("link_checks").update(updates).eq("id", existing.id);
  } else {
    if (isBroken) payload.first_broken_at = now;
    await client.from("link_checks").insert(payload);
  }
}

export async function getBrokenLinks(
  client: SupabaseClient,
  limit = 200
): Promise<LinkCheck[]> {
  const { data, error } = await client
    .from("link_checks")
    .select("*")
    .eq("is_broken", true)
    .order("last_checked_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getAllLinkChecks(
  client: SupabaseClient,
  opts?: {
    broken?: boolean;
    internal?: boolean;
    source?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ checks: LinkCheck[]; total: number }> {
  let query = client.from("link_checks").select("*", { count: "exact" });

  if (opts?.broken !== undefined) query = query.eq("is_broken", opts.broken);
  if (opts?.internal !== undefined)
    query = query.eq("is_internal", opts.internal);
  if (opts?.source) query = query.eq("source_url", opts.source);

  query = query
    .order("last_checked_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.offset)
    query = query.range(
      opts.offset,
      opts.offset + (opts.limit ?? 100) - 1
    );

  const { data, error, count } = await query;
  if (error) throw error;
  return { checks: data ?? [], total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// not_found_log
// ---------------------------------------------------------------------------

export async function log404(
  client: SupabaseClient,
  url: string,
  referrer?: string | null,
  userAgent?: string | null
): Promise<void> {
  const now = new Date().toISOString();

  const { data: existing } = await client
    .from("not_found_log")
    .select("id, count")
    .eq("url", url)
    .single();

  if (existing) {
    await client
      .from("not_found_log")
      .update({ count: existing.count + 1, last_seen_at: now })
      .eq("id", existing.id);
  } else {
    await client.from("not_found_log").insert({
      url,
      referrer: referrer ?? null,
      user_agent: userAgent ?? null,
    });
  }
}

export async function get404Logs(
  client: SupabaseClient,
  limit = 200
): Promise<NotFoundLog[]> {
  const { data, error } = await client
    .from("not_found_log")
    .select("*")
    .order("count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
