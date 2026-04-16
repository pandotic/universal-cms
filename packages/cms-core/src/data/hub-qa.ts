import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubContentQAReview,
  HubContentQAReviewInsert,
  HubAutoPilotSettings,
  HubAutoPilotSettingsUpsert,
  HubQALearningLog,
  HubQALearningLogInsert,
} from "../types/hub-qa";

const QA_TABLE = "hub_content_qa_reviews";
const AUTOPILOT_TABLE = "hub_auto_pilot_settings";
const LEARNING_TABLE = "hub_qa_learning_log";

// ─── QA Reviews ─────────────────────────────────────────────────────────

export async function createQAReview(
  client: SupabaseClient,
  review: HubContentQAReviewInsert
): Promise<HubContentQAReview> {
  const { data, error } = await client
    .from(QA_TABLE)
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listQAReviewsForContent(
  client: SupabaseClient,
  contentId: string,
  contentTable?: string
): Promise<HubContentQAReview[]> {
  let query = client.from(QA_TABLE).select("*").eq("content_id", contentId);
  if (contentTable) query = query.eq("content_table", contentTable);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateQAReview(
  client: SupabaseClient,
  id: string,
  updates: Partial<Pick<HubContentQAReview, "human_override" | "override_reason" | "status">>
): Promise<HubContentQAReview> {
  const { data, error } = await client
    .from(QA_TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Auto-Pilot Settings ────────────────────────────────────────────────

export async function getAutoPilotSettings(
  client: SupabaseClient,
  propertyId: string
): Promise<HubAutoPilotSettings[]> {
  const { data, error } = await client
    .from(AUTOPILOT_TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .order("content_type");

  if (error) throw error;
  return data ?? [];
}

export async function upsertAutoPilotSettings(
  client: SupabaseClient,
  settings: HubAutoPilotSettingsUpsert
): Promise<HubAutoPilotSettings> {
  const { data, error } = await client
    .from(AUTOPILOT_TABLE)
    .upsert(
      { ...settings, updated_at: new Date().toISOString() },
      { onConflict: "property_id,content_type" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── QA Learning Log ────────────────────────────────────────────────────

export async function logQALearning(
  client: SupabaseClient,
  entry: HubQALearningLogInsert
): Promise<HubQALearningLog> {
  const { data, error } = await client
    .from(LEARNING_TABLE)
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRecentLearnings(
  client: SupabaseClient,
  propertyId: string,
  limit: number = 50
): Promise<HubQALearningLog[]> {
  const { data, error } = await client
    .from(LEARNING_TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
