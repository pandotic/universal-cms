import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SkillDefinition,
  SkillDefinitionInsert,
  SkillDefinitionUpdate,
  SkillFilters,
  SkillScope,
  SkillVersion,
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
  if (filters?.scope) query = query.eq("scope", filters.scope);
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

// ─── Scope Queries ────────────────────────────────────────────────────────

export async function listSkillsByScope(
  client: SupabaseClient,
  scope: SkillScope
): Promise<SkillDefinition[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .or(`scope.eq.${scope},scope.eq.both`)
    .neq("status", "archived")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

// ─── Version Queries ──────────────────────────────────────────────────────

const VERSIONS_TABLE = "hub_skill_versions";

export async function listVersions(
  client: SupabaseClient,
  skillId: string
): Promise<SkillVersion[]> {
  const { data, error } = await client
    .from(VERSIONS_TABLE)
    .select("*")
    .eq("skill_id", skillId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSkillWithVersions(
  client: SupabaseClient,
  id: string
): Promise<{ skill: SkillDefinition; versions: SkillVersion[] } | null> {
  const skill = await getSkillById(client, id);
  if (!skill) return null;

  const versions = await listVersions(client, id);
  return { skill, versions };
}

export async function recordVersion(
  client: SupabaseClient,
  skillId: string,
  version: string,
  contentHash: string,
  changelog?: string
): Promise<SkillVersion> {
  const { data, error } = await client
    .from(VERSIONS_TABLE)
    .insert({
      skill_id: skillId,
      version,
      content_hash: contentHash,
      changelog: changelog ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
