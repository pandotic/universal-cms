import type { SupabaseClient } from "@supabase/supabase-js";

export type PageType = "article" | "guide" | "landing" | "custom";
export type PageStatus = "draft" | "published" | "archived";

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  page_type: PageType;
  body: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  status: PageStatus;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAllContentPages(client: SupabaseClient): Promise<ContentPage[]> {
  const { data, error } = await client
    .from("content_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedContentPages(client: SupabaseClient): Promise<ContentPage[]> {
  const { data, error } = await client
    .from("content_pages")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getContentPageBySlug(
  client: SupabaseClient,
  slug: string
): Promise<ContentPage | null> {
  const { data, error } = await client
    .from("content_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getContentPageById(
  client: SupabaseClient,
  id: string
): Promise<ContentPage | null> {
  const { data, error } = await client
    .from("content_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createContentPage(
  client: SupabaseClient,
  page: Partial<ContentPage>
): Promise<ContentPage> {
  const { data, error } = await client
    .from("content_pages")
    .insert(page)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContentPage(
  client: SupabaseClient,
  id: string,
  updates: Partial<ContentPage>
): Promise<ContentPage> {
  const { data, error } = await client
    .from("content_pages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContentPage(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client
    .from("content_pages")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
