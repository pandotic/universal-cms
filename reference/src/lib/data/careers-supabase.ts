/**
 * Career Hub data layer — Supabase-backed queries.
 * Falls back to JSON seed data if Supabase is unavailable (env vars missing).
 *
 * Server-side only (uses getSupabaseAdmin).
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

let supabaseAvailable: boolean | null = null;

function isSupabaseConfigured(): boolean {
  if (supabaseAvailable !== null) return supabaseAvailable;
  supabaseAvailable =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return supabaseAvailable;
}

async function getClient() {
  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  return getSupabaseAdmin();
}

// ── Providers ──

export async function getAllProvidersDB(): Promise<CHProvider[]> {
  if (!isSupabaseConfigured()) {
    const { getAllProviders } = await import("./careers");
    return getAllProviders();
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_providers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as CHProvider[];
}

export async function getProviderBySlugDB(
  slug: string,
): Promise<CHProvider | undefined> {
  if (!isSupabaseConfigured()) {
    const { getProviderBySlug } = await import("./careers");
    return getProviderBySlug(slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_providers")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as CHProvider) ?? undefined;
}

// ── Roles ──

export async function getAllRolesDB(): Promise<CHRole[]> {
  if (!isSupabaseConfigured()) {
    const { getAllRoles } = await import("./careers");
    return getAllRoles();
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_roles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as CHRole[];
}

export async function getRoleBySlugDB(
  slug: string,
): Promise<CHRole | undefined> {
  if (!isSupabaseConfigured()) {
    const { getRoleBySlug } = await import("./careers");
    return getRoleBySlug(slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_roles")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as CHRole) ?? undefined;
}

// ── Tags ──

export async function getAllTagsDB(): Promise<CHTag[]> {
  if (!isSupabaseConfigured()) {
    const { getAllCHTags } = await import("./careers");
    return getAllCHTags();
  }
  const sb = await getClient();
  const { data } = await sb.from("ch_tags").select("*").order("name");
  return (data ?? []) as CHTag[];
}

// ── Job Sources ──

export async function getAllJobSourcesDB(): Promise<CHJobSource[]> {
  if (!isSupabaseConfigured()) {
    const { getAllJobSources } = await import("./careers");
    return getAllJobSources();
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

export async function getAllProgramsDB(): Promise<CHProgram[]> {
  if (!isSupabaseConfigured()) {
    const { getAllPrograms } = await import("./careers");
    return getAllPrograms();
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true)
    .order("featured_rank");
  return (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    provider_id: (p.provider as CHProvider)?.id ?? p.provider_id,
  })) as CHProgram[];
}

export async function getProgramBySlugDB(
  slug: string,
): Promise<CHProgram | undefined> {
  if (!isSupabaseConfigured()) {
    const { getProgramBySlug } = await import("./careers");
    return getProgramBySlug(slug);
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
    provider_id: (data.provider as CHProvider)?.id ?? data.provider_id,
  } as CHProgram;
}

export async function getFeaturedProgramsDB(): Promise<CHProgram[]> {
  if (!isSupabaseConfigured()) {
    const { getFeaturedPrograms } = await import("./careers");
    return getFeaturedPrograms();
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("featured_rank");
  return (data ?? []) as CHProgram[];
}

export async function getFreeProgramsDB(): Promise<CHProgram[]> {
  if (!isSupabaseConfigured()) {
    const { getFreePrograms } = await import("./careers");
    return getFreePrograms();
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_free", true)
    .eq("is_active", true);
  return (data ?? []) as CHProgram[];
}

export async function filterProgramsDB(
  filters: ProgramFilters,
): Promise<CHProgram[]> {
  if (!isSupabaseConfigured()) {
    const { filterPrograms } = await import("./careers");
    return filterPrograms(filters);
  }
  const sb = await getClient();
  let query = sb
    .from("ch_programs")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true);

  if (filters.type) query = query.eq("program_type", filters.type);
  if (filters.level) query = query.eq("level", filters.level);
  if (filters.format) query = query.eq("format", filters.format);
  if (filters.is_free === true) query = query.eq("is_free", true);
  if (filters.provider_slug) {
    // Need subquery via provider join
    query = query.eq("provider.slug", filters.provider_slug);
  }
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,short_summary.ilike.%${filters.search}%`,
    );
  }

  const { data } = await query;
  return (data ?? []) as CHProgram[];
}

// ── Resources ──

export async function getAllResourcesDB(): Promise<CHResource[]> {
  if (!isSupabaseConfigured()) {
    const { getAllResources } = await import("./careers");
    return getAllResources();
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_resources")
    .select("*, provider:ch_providers(*)")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as CHResource[];
}

export async function getResourceBySlugDB(
  slug: string,
): Promise<CHResource | undefined> {
  if (!isSupabaseConfigured()) {
    const { getResourceBySlug } = await import("./careers");
    return getResourceBySlug(slug);
  }
  const sb = await getClient();
  const { data } = await sb
    .from("ch_resources")
    .select("*, provider:ch_providers(*)")
    .eq("slug", slug)
    .single();
  return (data as CHResource) ?? undefined;
}

// ── Junction helpers ──

export async function getProgramsForRoleDB(
  roleSlug: string,
): Promise<CHProgram[]> {
  if (!isSupabaseConfigured()) {
    const { getProgramsForRole } = await import("./careers");
    return getProgramsForRole(roleSlug);
  }
  const sb = await getClient();
  // Get role ID first
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
  return (data ?? []).map(
    (r: Record<string, unknown>) => r.program as CHProgram,
  ).filter(Boolean);
}

export async function getRolesForProgramDB(
  programSlug: string,
): Promise<CHRole[]> {
  if (!isSupabaseConfigured()) {
    const { getRolesForProgram } = await import("./careers");
    return getRolesForProgram(programSlug);
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
  return (data ?? []).map(
    (r: Record<string, unknown>) => r.role as CHRole,
  ).filter(Boolean);
}

export async function getTagsForProgramDB(
  programSlug: string,
): Promise<CHTag[]> {
  if (!isSupabaseConfigured()) {
    const { getTagsForProgram } = await import("./careers");
    return getTagsForProgram(programSlug);
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
  return (data ?? []).map(
    (r: Record<string, unknown>) => r.tag as CHTag,
  ).filter(Boolean);
}

export async function getResourcesForRoleDB(
  roleSlug: string,
): Promise<CHResource[]> {
  if (!isSupabaseConfigured()) {
    const { getResourcesForRole } = await import("./careers");
    return getResourcesForRole(roleSlug);
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
  return (data ?? []).map(
    (r: Record<string, unknown>) => r.resource as CHResource,
  ).filter(Boolean);
}

export async function getRecommendedProgramsForRoleDB(
  roleSlug: string,
): Promise<CHRoleRecommendedProgram[]> {
  if (!isSupabaseConfigured()) {
    const { getRecommendedProgramsForRole } = await import("./careers");
    return getRecommendedProgramsForRole(roleSlug);
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
  return (data ?? []).map((r: Record<string, unknown>) => ({
    role_id: role.id,
    program_id: (r.program as CHProgram)?.id ?? "",
    recommendation_type: r.recommendation_type as string,
    progression_stage: r.progression_stage as string,
    is_free_priority: r.is_free_priority as boolean,
    sort_order: r.sort_order as number,
    program: r.program as CHProgram,
  })) as CHRoleRecommendedProgram[];
}

export async function getRoleProgressionPathsDB(
  roleSlug: string,
): Promise<CHRoleProgressionPath[]> {
  if (!isSupabaseConfigured()) {
    const { getRoleProgressionPaths } = await import("./careers");
    return getRoleProgressionPaths(roleSlug);
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
  return (data ?? []).map((r: Record<string, unknown>) => ({
    from_role_id: role.id,
    to_role_id: (r.to_role as CHRole)?.id ?? "",
    transition_summary: r.transition_summary as string,
    sort_order: r.sort_order as number,
    to_role: r.to_role as CHRole,
  })) as CHRoleProgressionPath[];
}

export async function getProgramsForProviderDB(
  providerSlug: string,
): Promise<CHProgram[]> {
  if (!isSupabaseConfigured()) {
    const { getProgramsForProvider } = await import("./careers");
    return getProgramsForProvider(providerSlug);
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
    .eq("is_active", true);
  return (data ?? []) as CHProgram[];
}

export async function getResourcesForProviderDB(
  providerSlug: string,
): Promise<CHResource[]> {
  if (!isSupabaseConfigured()) {
    const { getResourcesForProvider } = await import("./careers");
    return getResourcesForProvider(providerSlug);
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
    .eq("is_active", true);
  return (data ?? []) as CHResource[];
}
