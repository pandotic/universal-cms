import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LLMProvider,
  ModelId,
  OutputMode,
  PromptTone,
} from "../types/promptkit.js";

const TABLE = "promptkit_history";

export interface PromptkitHistoryRow {
  id: string;
  user_id: string;
  provider: LLMProvider;
  model_id: ModelId;
  model_label: string | null;
  raw_prompt: string;
  optimized_prompt: string;
  notes: string[];
  tone: PromptTone;
  output_mode: OutputMode;
  is_favorite: boolean;
  label: string | null;
  created_at: string;
}

export interface PromptkitHistoryFilters {
  provider?: LLMProvider;
  favorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface SavePromptkitEntryInput {
  user_id: string;
  provider: LLMProvider;
  model_id: ModelId;
  model_label?: string;
  raw_prompt: string;
  optimized_prompt: string;
  notes: string[];
  tone: PromptTone;
  output_mode: OutputMode;
  label?: string;
}

export async function listPromptkitHistory(
  client: SupabaseClient,
  userId: string,
  filters?: PromptkitHistoryFilters
): Promise<{ entries: PromptkitHistoryRow[]; total: number }> {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let query = client
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (filters?.provider) query = query.eq("provider", filters.provider);
  if (filters?.favorite === true) query = query.eq("is_favorite", true);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { entries: (data ?? []) as PromptkitHistoryRow[], total: count ?? 0 };
}

export async function getPromptkitEntryById(
  client: SupabaseClient,
  id: string
): Promise<PromptkitHistoryRow | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as PromptkitHistoryRow | null) ?? null;
}

export async function savePromptkitEntry(
  client: SupabaseClient,
  input: SavePromptkitEntryInput
): Promise<PromptkitHistoryRow> {
  const { data, error } = await client
    .from(TABLE)
    .insert({
      user_id: input.user_id,
      provider: input.provider,
      model_id: input.model_id,
      model_label: input.model_label ?? null,
      raw_prompt: input.raw_prompt,
      optimized_prompt: input.optimized_prompt,
      notes: input.notes,
      tone: input.tone,
      output_mode: input.output_mode,
      label: input.label ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PromptkitHistoryRow;
}

export async function deletePromptkitEntry(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function togglePromptkitFavorite(
  client: SupabaseClient,
  id: string,
  isFavorite: boolean
): Promise<PromptkitHistoryRow> {
  const { data, error } = await client
    .from(TABLE)
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as PromptkitHistoryRow;
}

export async function clearPromptkitHistory(
  client: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("is_favorite", false);
  if (error) throw error;
}
