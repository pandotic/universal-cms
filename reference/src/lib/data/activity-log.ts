import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "login"
  | "bulk_import";

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: ActivityAction;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function logActivity(entry: {
  user_id?: string;
  action: ActivityAction;
  entity_type: string;
  entity_id?: string;
  entity_title?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from("activity_log").insert({
    user_id: entry.user_id ?? null,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    entity_title: entry.entity_title ?? null,
    metadata: entry.metadata ?? {},
  });

  if (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getActivityLog(options?: {
  entityType?: string;
  action?: ActivityAction;
  limit?: number;
  offset?: number;
}): Promise<{ entries: ActivityLogEntry[]; total: number }> {
  const supabase = await getSupabaseAdmin();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from("activity_log")
    .select("*", { count: "exact" });

  if (options?.entityType) {
    query = query.eq("entity_type", options.entityType);
  }
  if (options?.action) {
    query = query.eq("action", options.action);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { entries: data ?? [], total: count ?? 0 };
}

export async function getRecentActivity(
  limit = 10
): Promise<ActivityLogEntry[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
