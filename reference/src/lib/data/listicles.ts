import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ListicleStatus = "draft" | "published" | "archived";

export interface Listicle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: ListicleStatus;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListicleItem {
  id: string;
  listicle_id: string;
  entity_id: string | null;
  position: number;
  label: string | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_image: string | null;
  pros: string[];
  cons: string[];
  affiliate_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListicleWithItems extends Listicle {
  items: ListicleItem[];
}

export async function getAllListicles(): Promise<Listicle[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedListicles(): Promise<Listicle[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listicles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getListicleBySlug(
  slug: string
): Promise<ListicleWithItems | null> {
  const supabase = await getSupabaseAdmin();
  const { data: listicle, error } = await supabase
    .from("listicles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!listicle) return null;

  const { data: items, error: itemsError } = await supabase
    .from("listicle_items")
    .select("*")
    .eq("listicle_id", listicle.id)
    .order("position", { ascending: true });

  if (itemsError) throw itemsError;

  return { ...listicle, items: items ?? [] };
}

export async function getListicleById(
  id: string
): Promise<ListicleWithItems | null> {
  const supabase = await getSupabaseAdmin();
  const { data: listicle, error } = await supabase
    .from("listicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!listicle) return null;

  const { data: items, error: itemsError } = await supabase
    .from("listicle_items")
    .select("*")
    .eq("listicle_id", listicle.id)
    .order("position", { ascending: true });

  if (itemsError) throw itemsError;

  return { ...listicle, items: items ?? [] };
}

export async function createListicle(
  listicle: Partial<Listicle>
): Promise<Listicle> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listicles")
    .insert(listicle)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateListicle(
  id: string,
  updates: Partial<Listicle>
): Promise<Listicle> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listicles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteListicle(id: string): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from("listicles").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertListicleItems(
  listicleId: string,
  items: Partial<ListicleItem>[]
): Promise<ListicleItem[]> {
  const supabase = await getSupabaseAdmin();

  // Delete existing items
  await supabase.from("listicle_items").delete().eq("listicle_id", listicleId);

  // Insert new items with positions
  const itemsWithPositions = items.map((item, index) => ({
    ...item,
    listicle_id: listicleId,
    position: index,
  }));

  const { data, error } = await supabase
    .from("listicle_items")
    .insert(itemsWithPositions)
    .select();

  if (error) throw error;
  return data ?? [];
}
