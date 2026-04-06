import { getSupabaseAdmin } from "@/lib/supabase/server";

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

export interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  redirect_type: 301 | 302 | 307;
  is_regex: boolean;
  hits: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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

export async function recordLinkCheck(entry: {
  source_url: string;
  target_url: string;
  anchor_text?: string | null;
  status_code?: number | null;
  is_internal?: boolean;
  is_broken?: boolean;
  redirect_target?: string | null;
}): Promise<void> {
  const sb = await getSupabaseAdmin();
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

  // Only set first_broken_at when the link is broken for the first time
  // We handle this via upsert: on conflict update everything except first_broken_at
  // if is_broken is already true.
  const { data: existing } = await sb
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
    await sb.from("link_checks").update(updates).eq("id", existing.id);
  } else {
    if (isBroken) payload.first_broken_at = now;
    await sb.from("link_checks").insert(payload);
  }
}

export async function getBrokenLinks(limit = 200): Promise<LinkCheck[]> {
  const sb = await getSupabaseAdmin();
  const { data, error } = await sb
    .from("link_checks")
    .select("*")
    .eq("is_broken", true)
    .order("last_checked_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getAllLinkChecks(opts?: {
  broken?: boolean;
  internal?: boolean;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<{ checks: LinkCheck[]; total: number }> {
  const sb = await getSupabaseAdmin();
  let query = sb.from("link_checks").select("*", { count: "exact" });

  if (opts?.broken !== undefined) query = query.eq("is_broken", opts.broken);
  if (opts?.internal !== undefined) query = query.eq("is_internal", opts.internal);
  if (opts?.source) query = query.eq("source_url", opts.source);

  query = query
    .order("last_checked_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 100) - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { checks: data ?? [], total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// redirects
// ---------------------------------------------------------------------------

export async function getRedirects(activeOnly = false): Promise<Redirect[]> {
  const sb = await getSupabaseAdmin();
  let query = sb
    .from("redirects")
    .select("*")
    .order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createRedirect(
  fromPath: string,
  toPath: string,
  type: 301 | 302 | 307 = 301,
  notes?: string,
  createdBy?: string
): Promise<Redirect> {
  const sb = await getSupabaseAdmin();
  const { data, error } = await sb
    .from("redirects")
    .insert({
      from_path: fromPath,
      to_path: toPath,
      redirect_type: type,
      notes: notes ?? null,
      created_by: createdBy ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRedirect(
  id: string,
  updates: Partial<Pick<Redirect, "from_path" | "to_path" | "redirect_type" | "is_regex" | "is_active" | "notes">>
): Promise<Redirect> {
  const sb = await getSupabaseAdmin();
  const { data, error } = await sb
    .from("redirects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRedirect(id: string): Promise<void> {
  const sb = await getSupabaseAdmin();
  const { error } = await sb.from("redirects").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementRedirectHits(id: string): Promise<void> {
  const sb = await getSupabaseAdmin();
  // Use raw increment via rpc or read-then-write
  const { data } = await sb.from("redirects").select("hits").eq("id", id).single();
  if (data) {
    await sb
      .from("redirects")
      .update({ hits: data.hits + 1 })
      .eq("id", id);
  }
}

// ---------------------------------------------------------------------------
// not_found_log
// ---------------------------------------------------------------------------

export async function log404(
  url: string,
  referrer?: string | null,
  userAgent?: string | null
): Promise<void> {
  const sb = await getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing } = await sb
    .from("not_found_log")
    .select("id, count")
    .eq("url", url)
    .single();

  if (existing) {
    await sb
      .from("not_found_log")
      .update({ count: existing.count + 1, last_seen_at: now })
      .eq("id", existing.id);
  } else {
    await sb.from("not_found_log").insert({
      url,
      referrer: referrer ?? null,
      user_agent: userAgent ?? null,
    });
  }
}

export async function get404Logs(limit = 200): Promise<NotFoundLog[]> {
  const sb = await getSupabaseAdmin();
  const { data, error } = await sb
    .from("not_found_log")
    .select("*")
    .order("count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
