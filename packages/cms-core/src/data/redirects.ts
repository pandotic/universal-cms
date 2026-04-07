import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function getRedirects(
  client: SupabaseClient,
  activeOnly = false
): Promise<Redirect[]> {
  let query = client
    .from("redirects")
    .select("*")
    .order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createRedirect(
  client: SupabaseClient,
  fromPath: string,
  toPath: string,
  type: 301 | 302 | 307 = 301,
  notes?: string,
  createdBy?: string
): Promise<Redirect> {
  const { data, error } = await client
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
  client: SupabaseClient,
  id: string,
  updates: Partial<
    Pick<
      Redirect,
      | "from_path"
      | "to_path"
      | "redirect_type"
      | "is_regex"
      | "is_active"
      | "notes"
    >
  >
): Promise<Redirect> {
  const { data, error } = await client
    .from("redirects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRedirect(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from("redirects").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementRedirectHits(
  client: SupabaseClient,
  id: string
): Promise<void> {
  // Read-then-write increment
  const { data } = await client
    .from("redirects")
    .select("hits")
    .eq("id", id)
    .single();
  if (data) {
    await client
      .from("redirects")
      .update({ hits: data.hits + 1 })
      .eq("id", id);
  }
}
