import type { SupabaseClient } from "@supabase/supabase-js";

export type CtaBlockStatus = "draft" | "active" | "archived";

export interface CtaBlock {
  id: string;
  name: string;
  slug: string;
  placement: string;
  heading: string;
  subheading: string | null;
  primary_button_text: string | null;
  primary_button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  background_style: string;
  background_image_url: string | null;
  form_id: string | null;
  status: CtaBlockStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Public queries ──────────────────────────────────────────────────────────

export async function getCtaBlocksByPlacement(
  client: SupabaseClient,
  placement: string
): Promise<CtaBlock[]> {
  const { data, error } = await client
    .from("cta_blocks")
    .select("*")
    .eq("placement", placement)
    .eq("status", "active")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

// ── Admin CRUD ──────────────────────────────────────────────────────────────

export async function getAllCtaBlocks(
  client: SupabaseClient
): Promise<CtaBlock[]> {
  const { data, error } = await client
    .from("cta_blocks")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getCtaBlockById(
  client: SupabaseClient,
  id: string
): Promise<CtaBlock | null> {
  const { data, error } = await client
    .from("cta_blocks")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createCtaBlock(
  client: SupabaseClient,
  block: Partial<CtaBlock>
): Promise<CtaBlock> {
  const { data, error } = await client
    .from("cta_blocks")
    .insert(block)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCtaBlock(
  client: SupabaseClient,
  id: string,
  updates: Partial<CtaBlock>
): Promise<CtaBlock> {
  const { data, error } = await client
    .from("cta_blocks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCtaBlock(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from("cta_blocks")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
