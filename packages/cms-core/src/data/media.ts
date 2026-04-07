import type { SupabaseClient } from "@supabase/supabase-js";

export interface MediaItem {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export async function getAllMedia(client: SupabaseClient): Promise<MediaItem[]> {
  const { data, error } = await client
    .from("content_media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMediaById(
  client: SupabaseClient,
  id: string
): Promise<MediaItem | null> {
  const { data, error } = await client
    .from("content_media")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function uploadMedia(
  client: SupabaseClient,
  file: File,
  bucket: string,
  altText?: string,
  caption?: string,
  uploadedBy?: string
): Promise<MediaItem> {
  // Generate unique storage path
  const timestamp = Date.now();
  const storagePath = `${timestamp}-${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Create media record
  const { data, error } = await client
    .from("content_media")
    .insert({
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText,
      caption,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMedia(
  client: SupabaseClient,
  id: string,
  updates: { alt_text?: string; caption?: string }
): Promise<MediaItem> {
  const { data, error } = await client
    .from("content_media")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedia(
  client: SupabaseClient,
  id: string,
  bucket: string
): Promise<void> {
  // Get the storage path first
  const { data: media } = await client
    .from("content_media")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (media) {
    // Delete from storage
    await client.storage
      .from(bucket)
      .remove([media.storage_path]);
  }

  // Delete the record
  const { error } = await client
    .from("content_media")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function getMediaPublicUrl(
  supabaseUrl: string,
  bucket: string,
  storagePath: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}
