/**
 * Career Hub data layer — async with Supabase fallback to static seed JSON.
 * Follows the same sbReady() pattern as entities.ts, frameworks.ts, etc.
 */

import type {
  CHProvider,
  CHProgram,
  CHRole,
  CHTag,
  CHJobSource,
  CHResource,
  CHRoleRecommendedProgram,
  CHRoleProgressionPath,
  ProgramFilters,
} from "@/lib/types/careers";

// Seed data imports (JSON fallback)
import providersData from "@/../docs/esg_source_career_hub_package/seeds/providers.seed.json";
import programsData from "@/../docs/esg_source_career_hub_package/seeds/programs.seed.json";
import rolesData from "@/../docs/esg_source_career_hub_package/seeds/roles.seed.json";
import tagsData from "@/../docs/esg_source_career_hub_package/seeds/tags.seed.json";
import jobSourcesData from "@/../docs/esg_source_career_hub_package/seeds/job-sources.seed.json";
import resourcesData from "@/../docs/esg_source_career_hub_package/seeds/resources.seed.json";
import programRolesData from "@/../docs/esg_source_career_hub_package/seeds/program-roles.seed.json";
import programTagsData from "@/../docs/esg_source_career_hub_package/seeds/program-tags.seed.json";
import roleRecommendedProgramsData from "@/../docs/esg_source_career_hub_package/seeds/role-recommended-programs.seed.json";
import roleResourcesData from "@/../docs/esg_source_career_hub_package/seeds/role-resources.seed.json";
import roleProgressionPathsData from "@/../docs/esg_source_career_hub_package/seeds/role-progression-paths.seed.json";

// ── Supabase readiness check ──

let _sbConfigured: boolean | null = null;
function sbReady(): boolean {
  if (_sbConfigured !== null) return _sbConfigured;
  _sbConfigured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return _sbConfigured;
}

async function getClient() {
  const { getSupabaseAdmin } = await import("@/lib/supabase/server");
  return getSupabaseAdmin();
}

// Type-safe casts with generated IDs based on slug (JSON fallback)
function withId<T extends { slug: string }>(item: T): T & { id: string } {
  return { ...item, id: item.slug };
}

// ── Providers ──

export async function getAllProviders(): Promise<CHProvider[]> {
  if (!sbReady()) {
    return (providersData as CHProvider[])
      .map(withId)
      .filter((p) => p.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_providers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as CHProvider[];
}

export async function getProviderBySlug(slug: string): Promise<CHProvider | undefined> {
  if (!sbReady()) {
    return (providersData as CHProvider[])
      .map(withId)
      .find((p) => p.slug === slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_providers")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as CHProvider) ?? undefined;
}

export async function getFeaturedProviders(): Promise<CHProvider[]> {
  if (!sbReady()) {
    return (await getAllProviders()).filter((p) => p.is_featured);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_providers")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order");
  return (data ?? []) as CHProvider[];
}

// ── Roles ──

export async function getAllRoles(): Promise<CHRole[]> {
  if (!sbReady()) {
    return (rolesData as CHRole[])
      .map(withId)
      .filter((r) => r.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_roles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as CHRole[];
}

export async function getRoleBySlug(slug: string): Promise<CHRole | undefined> {
  if (!sbReady()) {
    return (rolesData as CHRole[]).map(withId).find((r) => r.slug === slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_roles")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as CHRole) ?? undefined;
}

export async function getFeaturedRoles(): Promise<CHRole[]> {
  if (!sbReady()) {
    return (await getAllRoles()).filter((r) => r.is_featured);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_roles")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order");
  return (data ?? []) as CHRole[];
}

// ── Tags ──

export async function getAllCHTags(): Promise<CHTag[]> {
  if (!sbReady()) {
    return (tagsData as CHTag[]).map(withId);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_tags")
    .select("*")
    .order("name");
  return (data ?? []) as CHTag[];
}

export async function getTagBySlug(slug: string): Promise<CHTag | undefined> {
  if (!sbReady()) {
    return (tagsData as CHTag[]).map(withId).find((t) => t.slug === slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_tags")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as CHTag) ?? undefined;
}

export async function getFeaturedTags(): Promise<CHTag[]> {
  if (!sbReady()) {
    return (await getAllCHTags()).filter((t) => t.is_featured);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_tags")
    .select("*")
    .eq("is_featured", true)
    .order("name");
  return (data ?? []) as CHTag[];
}

// ── Job Sources ──

export async function getAllJobSources(): Promise<CHJobSource[]> {
  if (!sbReady()) {
    return (jobSourcesData as CHJobSource[])
      .map(withId)
      .filter((j) => j.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_job_sources")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as CHJobSource[];
}

// ── Programs ──

async function resolveProviderForProgram(p: Record<string, unknown>): Promise<CHProgram> {
  const providerSlug = (p.provider_slug as string) ?? "";
  const provider = await getProviderBySlug(providerSlug);
  return {
    ...withId(p as unknown as CHProgram),
    provider_id: provider?.id ?? "",
    provider,
  };
}

export async function getAllPrograms(): Promise<CHProgram[]> {
  if (!sbReady()) {
    const resolved = await Promise.all(
      programsData.map((p) => resolveProviderForProgram(p as unknown as Record<string, unknown>))
    );
    return resolved.filter((p) => p.is_active !== false);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true)
    .order("title");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHProgram[];
}

export async function getProgramBySlug(slug: string): Promise<CHProgram | undefined> {
  if (!sbReady()) {
    return (await getAllPrograms()).find((p) => p.slug === slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("slug", slug)
    .single();
  if (!data) return undefined;
  return {
    ...data,
    provider: data.provider || undefined,
  } as CHProgram;
}

export async function getFeaturedPrograms(): Promise<CHProgram[]> {
  if (!sbReady()) {
    return (await getAllPrograms())
      .filter((p) => p.is_featured)
      .sort((a, b) => (a.featured_rank ?? 0) - (b.featured_rank ?? 0));
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("featured_rank");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHProgram[];
}

export async function getCertificationPrograms(): Promise<CHProgram[]> {
  if (!sbReady()) {
    return (await getAllPrograms()).filter(
      (p) => p.program_type === "certification" || p.credential_awarded,
    );
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true)
    .or("program_type.eq.certification,credential_awarded.eq.true")
    .order("featured_rank");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHProgram[];
}

export async function getFreePrograms(): Promise<CHProgram[]> {
  if (!sbReady()) {
    return (await getAllPrograms()).filter((p) => p.is_free);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true)
    .eq("is_free", true)
    .order("title");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHProgram[];
}

export async function filterPrograms(filters: ProgramFilters): Promise<CHProgram[]> {
  if (!sbReady()) {
    let programs = await getAllPrograms();
    if (filters.type) programs = programs.filter((p) => p.program_type === filters.type);
    if (filters.level) programs = programs.filter((p) => p.level === filters.level);
    if (filters.format) programs = programs.filter((p) => p.format === filters.format);
    if (filters.is_free === true) programs = programs.filter((p) => p.is_free);
    if (filters.provider_slug) {
      programs = programs.filter((p) => p.provider?.slug === filters.provider_slug);
    }
    if (filters.tag_slug) {
      const tagProgramSlugs = await getTagProgramSlugs(filters.tag_slug);
      programs = programs.filter((p) => tagProgramSlugs.has(p.slug));
    }
    if (filters.role_slug) {
      const roleProgramSlugs = await getRoleProgramSlugs(filters.role_slug);
      programs = programs.filter((p) => roleProgramSlugs.has(p.slug));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      programs = programs.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.short_summary?.toLowerCase().includes(q) ||
          p.provider?.name.toLowerCase().includes(q),
      );
    }
    return programs;
  }

  // Supabase path — build query dynamically
  const sb = await getClient();
  let query = sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true);

  if (filters.type) query = query.eq("program_type", filters.type);
  if (filters.level) query = query.eq("level", filters.level);
  if (filters.format) query = query.eq("format", filters.format);
  if (filters.is_free === true) query = query.eq("is_free", true);
  if (filters.search) query = query.or(
    `title.ilike.%${filters.search}%,short_summary.ilike.%${filters.search}%`
  );

  const { data } = await query.order("title");
  let programs = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHProgram[];

  // Post-filter for junction-based filters (provider_slug, tag_slug, role_slug)
  if (filters.provider_slug) {
    programs = programs.filter((p) => p.provider?.slug === filters.provider_slug);
  }
  if (filters.tag_slug) {
    const tagProgramSlugs = await getTagProgramSlugs(filters.tag_slug);
    programs = programs.filter((p) => tagProgramSlugs.has(p.slug));
  }
  if (filters.role_slug) {
    const roleProgramSlugs = await getRoleProgramSlugs(filters.role_slug);
    programs = programs.filter((p) => roleProgramSlugs.has(p.slug));
  }

  return programs;
}

// ── Resources ──

export async function getAllResources(): Promise<CHResource[]> {
  if (!sbReady()) {
    return await Promise.all(
      (resourcesData as Array<Record<string, unknown>>).map(async (r) => {
        const provider = await getProviderBySlug((r.provider_slug as string) ?? "");
        return {
          ...withId(r as unknown as CHResource),
          provider_id: provider?.id ?? null,
          provider,
        };
      })
    ).then((arr) => arr.filter((r) => r.is_active !== false));
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_resources")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHResource[];
}

export async function getResourceBySlug(slug: string): Promise<CHResource | undefined> {
  if (!sbReady()) {
    return (await getAllResources()).find((r) => r.slug === slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_resources")
    .select("*, provider:ch_providers(*)")
    .eq("slug", slug)
    .single();
  if (!data) return undefined;
  return { ...data, provider: data.provider || undefined } as CHResource;
}

// ── Junction helpers ──

async function getTagProgramSlugs(tagSlug: string): Promise<Set<string>> {
  if (!sbReady()) {
    return new Set(
      (programTagsData as Array<{ program_slug: string; tag_slug: string }>)
        .filter((pt) => pt.tag_slug === tagSlug)
        .map((pt) => pt.program_slug),
    );
  }
  const sb = await getClient();
  const { data: tag } = await sb
    .from("ch_tags")
    .select("id")
    .eq("slug", tagSlug)
    .single();
  if (!tag) return new Set();
  const { data } = await sb
    .from("ch_program_tags")
    .select("program_id, program:ch_programs(slug)")
    .eq("tag_id", tag.id);
  return new Set(
    (data ?? []).map((row: Record<string, unknown>) => {
      const prog = row.program as Record<string, unknown> | null;
      return prog?.slug as string;
    }).filter(Boolean),
  );
}

async function getRoleProgramSlugs(roleSlug: string): Promise<Set<string>> {
  if (!sbReady()) {
    return new Set(
      (programRolesData as Array<{ program_slug: string; role_slug: string }>)
        .filter((pr) => pr.role_slug === roleSlug)
        .map((pr) => pr.program_slug),
    );
  }
  const sb = await getClient();
  const { data: role } = await sb
    .from("ch_roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();
  if (!role) return new Set();
  const { data } = await sb
    .from("ch_program_roles")
    .select("program_id, program:ch_programs(slug)")
    .eq("role_id", role.id);
  return new Set(
    (data ?? []).map((row: Record<string, unknown>) => {
      const prog = row.program as Record<string, unknown> | null;
      return prog?.slug as string;
    }).filter(Boolean),
  );
}

export async function getProgramsForRole(roleSlug: string): Promise<CHProgram[]> {
  if (!sbReady()) {
    const slugs = await getRoleProgramSlugs(roleSlug);
    return (await getAllPrograms()).filter((p) => slugs.has(p.slug));
  }
  const sb = await getClient();
  const { data: role } = await sb
    .from("ch_roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();
  if (!role) return [];
  const { data } = await sb
    .from("ch_program_roles")
    .select("program:ch_programs(*, provider:ch_providers(*))")
    .eq("role_id", role.id);
  return (data ?? [])
    .map((row: Record<string, unknown>) => row.program as CHProgram)
    .filter(Boolean);
}

export async function getRolesForProgram(programSlug: string): Promise<CHRole[]> {
  if (!sbReady()) {
    const roleSlugs = (
      programRolesData as Array<{ program_slug: string; role_slug: string }>
    )
      .filter((pr) => pr.program_slug === programSlug)
      .map((pr) => pr.role_slug);
    return (await getAllRoles()).filter((r) => roleSlugs.includes(r.slug));
  }
  const sb = await getClient();
  const { data: program } = await sb
    .from("ch_programs")
    .select("id")
    .eq("slug", programSlug)
    .single();
  if (!program) return [];
  const { data } = await sb
    .from("ch_program_roles")
    .select("role:ch_roles(*)")
    .eq("program_id", program.id);
  return (data ?? [])
    .map((row: Record<string, unknown>) => row.role as CHRole)
    .filter(Boolean);
}

export async function getTagsForProgram(programSlug: string): Promise<CHTag[]> {
  if (!sbReady()) {
    const tagSlugs = (
      programTagsData as Array<{ program_slug: string; tag_slug: string }>
    )
      .filter((pt) => pt.program_slug === programSlug)
      .map((pt) => pt.tag_slug);
    return (await getAllCHTags()).filter((t) => tagSlugs.includes(t.slug));
  }
  const sb = await getClient();
  const { data: program } = await sb
    .from("ch_programs")
    .select("id")
    .eq("slug", programSlug)
    .single();
  if (!program) return [];
  const { data } = await sb
    .from("ch_program_tags")
    .select("tag:ch_tags(*)")
    .eq("program_id", program.id);
  return (data ?? [])
    .map((row: Record<string, unknown>) => row.tag as CHTag)
    .filter(Boolean);
}

export async function getProgramsForProvider(providerSlug: string): Promise<CHProgram[]> {
  if (!sbReady()) {
    return (await getAllPrograms()).filter((p) => p.provider?.slug === providerSlug);
  }
  const sb = await getClient();
  const { data: provider } = await sb
    .from("ch_providers")
    .select("id")
    .eq("slug", providerSlug)
    .single();
  if (!provider) return [];
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("provider_id", provider.id)
    .eq("is_active", true)
    .order("title");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHProgram[];
}

export async function getResourcesForProvider(providerSlug: string): Promise<CHResource[]> {
  if (!sbReady()) {
    return (await getAllResources()).filter((r) => r.provider?.slug === providerSlug);
  }
  const sb = await getClient();
  const { data: provider } = await sb
    .from("ch_providers")
    .select("id")
    .eq("slug", providerSlug)
    .single();
  if (!provider) return [];
  const { data } = await sb
    .from("ch_resources")
    .select("*, provider:ch_providers(*)")
    .eq("provider_id", provider.id)
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    provider: row.provider || undefined,
  })) as CHResource[];
}

export async function getResourcesForRole(roleSlug: string): Promise<CHResource[]> {
  if (!sbReady()) {
    const resourceSlugs = (
      roleResourcesData as Array<{ role_slug: string; resource_slug: string }>
    )
      .filter((rr) => rr.role_slug === roleSlug)
      .map((rr) => rr.resource_slug);
    return (await getAllResources()).filter((r) => resourceSlugs.includes(r.slug));
  }
  const sb = await getClient();
  const { data: role } = await sb
    .from("ch_roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();
  if (!role) return [];
  const { data } = await sb
    .from("ch_role_resources")
    .select("resource:ch_resources(*, provider:ch_providers(*))")
    .eq("role_id", role.id)
    .order("sort_order");
  return (data ?? [])
    .map((row: Record<string, unknown>) => row.resource as CHResource)
    .filter(Boolean);
}

export async function getRecommendedProgramsForRole(
  roleSlug: string,
): Promise<CHRoleRecommendedProgram[]> {
  if (!sbReady()) {
    return (
      roleRecommendedProgramsData as Array<{
        role_slug: string;
        program_slug: string;
        recommendation_type: string;
        progression_stage: string;
        is_free_priority: boolean;
        sort_order: number;
      }>
    )
      .filter((rp) => rp.role_slug === roleSlug)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((rp) => ({
        role_id: roleSlug,
        program_id: rp.program_slug,
        recommendation_type: rp.recommendation_type,
        progression_stage: rp.progression_stage,
        is_free_priority: rp.is_free_priority,
        sort_order: rp.sort_order,
        // program is resolved lazily when needed
      }));
  }
  const sb = await getClient();
  const { data: role } = await sb
    .from("ch_roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();
  if (!role) return [];
  const { data } = await sb
    .from("ch_role_recommended_programs")
    .select("*, program:ch_programs(*, provider:ch_providers(*))")
    .eq("role_id", role.id)
    .order("sort_order");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    role_id: role.id,
    program_id: (row.program as Record<string, unknown>)?.id as string ?? "",
    recommendation_type: row.recommendation_type as string | null,
    progression_stage: row.progression_stage as string | null,
    is_free_priority: row.is_free_priority as boolean,
    sort_order: row.sort_order as number,
    program: row.program as CHProgram | undefined,
  })) as CHRoleRecommendedProgram[];
}

export async function getRoleProgressionPaths(
  roleSlug: string,
): Promise<CHRoleProgressionPath[]> {
  if (!sbReady()) {
    const paths = (
      roleProgressionPathsData as Array<{
        from_role_slug: string;
        to_role_slug: string;
        transition_summary: string;
        sort_order: number;
      }>
    )
      .filter((rp) => rp.from_role_slug === roleSlug)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return await Promise.all(
      paths.map(async (rp) => ({
        from_role_id: rp.from_role_slug,
        to_role_id: rp.to_role_slug,
        transition_summary: rp.transition_summary,
        sort_order: rp.sort_order,
        to_role: await getRoleBySlug(rp.to_role_slug),
      }))
    );
  }
  const sb = await getClient();
  const { data: role } = await sb
    .from("ch_roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();
  if (!role) return [];
  const { data } = await sb
    .from("ch_role_progression_paths")
    .select("*, to_role:ch_roles!ch_role_progression_paths_to_role_id_fkey(*)")
    .eq("from_role_id", role.id)
    .order("sort_order");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    from_role_id: row.from_role_id as string,
    to_role_id: row.to_role_id as string,
    transition_summary: row.transition_summary as string | null,
    sort_order: row.sort_order as number,
    to_role: row.to_role as CHRole | undefined,
  }));
}

export async function getRolesLeadingTo(roleSlug: string): Promise<CHRoleProgressionPath[]> {
  if (!sbReady()) {
    const paths = (
      roleProgressionPathsData as Array<{
        from_role_slug: string;
        to_role_slug: string;
        transition_summary: string;
        sort_order: number;
      }>
    ).filter((rp) => rp.to_role_slug === roleSlug);

    return await Promise.all(
      paths.map(async (rp) => ({
        from_role_id: rp.from_role_slug,
        to_role_id: rp.to_role_slug,
        transition_summary: rp.transition_summary,
        sort_order: rp.sort_order,
        from_role: await getRoleBySlug(rp.from_role_slug),
      }))
    );
  }
  const sb = await getClient();
  const { data: role } = await sb
    .from("ch_roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();
  if (!role) return [];
  const { data } = await sb
    .from("ch_role_progression_paths")
    .select("*, from_role:ch_roles!ch_role_progression_paths_from_role_id_fkey(*)")
    .eq("to_role_id", role.id);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    from_role_id: row.from_role_id as string,
    to_role_id: row.to_role_id as string,
    transition_summary: row.transition_summary as string | null,
    sort_order: row.sort_order as number,
    from_role: row.from_role as CHRole | undefined,
  }));
}
