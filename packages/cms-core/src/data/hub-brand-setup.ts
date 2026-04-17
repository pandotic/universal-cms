import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubBrandSetupTask,
  HubBrandSetupTaskInsert,
  HubBrandSetupTaskUpdate,
  SetupTaskFilters,
  SetupProgress,
} from "../types/hub-brand-setup";

const TABLE = "hub_brand_setup_checklist";

export async function listSetupTasks(
  client: SupabaseClient,
  propertyId: string,
  filters?: Omit<SetupTaskFilters, "propertyId">
): Promise<HubBrandSetupTask[]> {
  let query = client.from(TABLE).select("*").eq("property_id", propertyId);

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.tier) query = query.eq("tier", filters.tier);

  const limit = filters?.limit ?? 100;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("category")
    .order("tier")
    .order("task_name")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function createSetupTask(
  client: SupabaseClient,
  task: HubBrandSetupTaskInsert
): Promise<HubBrandSetupTask> {
  const { data, error } = await client
    .from(TABLE)
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSetupTask(
  client: SupabaseClient,
  id: string,
  updates: HubBrandSetupTaskUpdate
): Promise<HubBrandSetupTask> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeSetupTask(
  client: SupabaseClient,
  id: string,
  resultUrl?: string,
  completedBy?: string
): Promise<HubBrandSetupTask> {
  return updateSetupTask(client, id, {
    status: "completed",
    completed_at: new Date().toISOString(),
    completed_by: completedBy ?? null,
    result_url: resultUrl ?? null,
  });
}

export async function getSetupProgress(
  client: SupabaseClient,
  propertyId: string
): Promise<SetupProgress> {
  const { data, error } = await client
    .from(TABLE)
    .select("status, category")
    .eq("property_id", propertyId);

  if (error) throw error;

  const progress: SetupProgress = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    skipped: 0,
    blocked: 0,
    byCategory: {},
  };

  if (!data) return progress;

  for (const task of data) {
    progress.total += 1;

    switch (task.status) {
      case "completed": progress.completed += 1; break;
      case "in_progress": progress.inProgress += 1; break;
      case "pending": progress.pending += 1; break;
      case "skipped": progress.skipped += 1; break;
      case "blocked": progress.blocked += 1; break;
    }

    const cat = task.category as string;
    if (!progress.byCategory[cat]) {
      progress.byCategory[cat] = { total: 0, completed: 0 };
    }
    progress.byCategory[cat].total += 1;
    if (task.status === "completed") {
      progress.byCategory[cat].completed += 1;
    }
  }

  return progress;
}

export async function seedDefaultSetupTasks(
  client: SupabaseClient,
  propertyId: string,
  tasks: HubBrandSetupTaskInsert[]
): Promise<HubBrandSetupTask[]> {
  const rows = tasks.map((t) => ({ ...t, property_id: propertyId }));
  const { data, error } = await client
    .from(TABLE)
    .insert(rows)
    .select();

  if (error) throw error;
  return data ?? [];
}
