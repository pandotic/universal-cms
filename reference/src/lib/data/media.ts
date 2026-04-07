import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cmsConfig } from "@/lib/cms";

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

export async function getAllMedia(): Promise<MediaItem[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMediaById(id: string): Promise<MediaItem | null> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_media")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function uploadMedia(
  file: File,
  altText?: string,
  caption?: string,
  uploadedBy?: string
): Promise<MediaItem> {
  const supabase = await getSupabaseAdmin();
  const bucket = cmsConfig.storage.mediaBucket;

  // Generate unique storage path
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const storagePath = `${timestamp}-${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Create media record
  const { data, error } = await supabase
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
  id: string,
  updates: { alt_text?: string; caption?: string }
): Promise<MediaItem> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_media")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedia(id: string): Promise<void> {
  const supabase = await getSupabaseAdmin();

  // Get the storage path first
  const { data: media } = await supabase
    .from("content_media")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (media) {
    // Delete from storage
    await supabase.storage
      .from(cmsConfig.storage.mediaBucket)
      .remove([media.storage_path]);
  }

  // Delete the record
  const { error } = await supabase
    .from("content_media")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function getMediaPublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${cmsConfig.storage.mediaBucket}/${storagePath}`;
}
