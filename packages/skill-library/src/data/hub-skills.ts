import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SkillDefinition,
  SkillDefinitionInsert,
  SkillDefinitionUpdate,
  SkillFilters,
} from "../types/index";

const TABLE = "hub_skills";

export async function listSkills(
  client: SupabaseClient,
  filters?: SkillFilters
): Promise<SkillDefinition[]> {
  let query = client.from(TABLE).select("*");

  if (filters?.platform) query = query.eq("platform", filters.platform);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query.order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getSkillById(
  client: SupabaseClient,
  id: string
): Promise<SkillDefinition | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSkillBySlug(
  client: SupabaseClient,
  slug: string
): Promise<SkillDefinition | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSkill(
  client: SupabaseClient,
  skill: SkillDefinitionInsert
): Promise<SkillDefinition> {
  const { data, error } = await client
    .from(TABLE)
    .insert({ ...skill, version: skill.version ?? "0.1.0" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSkill(
  client: SupabaseClient,
  id: string,
  updates: SkillDefinitionUpdate
): Promise<SkillDefinition> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSkill(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
