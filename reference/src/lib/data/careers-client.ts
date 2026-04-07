/**
 * Client-safe career hub data functions.
 * These only use static JSON imports — no Supabase/server dependencies.
 * Use in "use client" components and services consumed by client components.
 * For server components, use careers.ts instead.
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

function withId<T extends { slug: string }>(item: T): T & { id: string } {
  return { ...item, id: item.slug };
}

// ── Providers ──

export function getAllProviders(): CHProvider[] {
  return (providersData as CHProvider[])
    .map(withId)
    .filter((p) => p.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function getProviderBySlug(slug: string): CHProvider | undefined {
  return getAllProviders().find((p) => p.slug === slug);
}

export function getFeaturedProviders(): CHProvider[] {
  return getAllProviders().filter((p) => p.is_featured);
}

// ── Roles ──

export function getAllRoles(): CHRole[] {
  return (rolesData as CHRole[])
    .map(withId)
    .filter((r) => r.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function getRoleBySlug(slug: string): CHRole | undefined {
  return getAllRoles().find((r) => r.slug === slug);
}

export function getFeaturedRoles(): CHRole[] {
  return getAllRoles().filter((r) => r.is_featured);
}

// ── Tags ──

export function getAllCHTags(): CHTag[] {
  return (tagsData as CHTag[]).map(withId);
}

export function getTagBySlug(slug: string): CHTag | undefined {
  return getAllCHTags().find((t) => t.slug === slug);
}

export function getFeaturedTags(): CHTag[] {
  return getAllCHTags().filter((t) => t.is_featured);
}

// ── Job Sources ──

export function getAllJobSources(): CHJobSource[] {
  return (jobSourcesData as CHJobSource[])
    .map(withId)
    .filter((j) => j.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

// ── Programs ──

function resolveProgram(p: Record<string, unknown>): CHProgram {
  const providerSlug = (p.provider_slug as string) ?? "";
  const provider = getProviderBySlug(providerSlug);
  return {
    ...withId(p as unknown as CHProgram),
    provider_id: provider?.id ?? "",
    provider,
  };
}

export function getAllPrograms(): CHProgram[] {
  return programsData
    .map((p) => resolveProgram(p as unknown as Record<string, unknown>))
    .filter((p) => p.is_active !== false);
}

export function getProgramBySlug(slug: string): CHProgram | undefined {
  return getAllPrograms().find((p) => p.slug === slug);
}

export function getFeaturedPrograms(): CHProgram[] {
  return getAllPrograms()
    .filter((p) => p.is_featured)
    .sort((a, b) => (a.featured_rank ?? 0) - (b.featured_rank ?? 0));
}

export function getCertificationPrograms(): CHProgram[] {
  return getAllPrograms().filter(
    (p) => p.program_type === "certification" || p.credential_awarded,
  );
}

export function getFreePrograms(): CHProgram[] {
  return getAllPrograms().filter((p) => p.is_free);
}

export function filterPrograms(filters: ProgramFilters): CHProgram[] {
  let programs = getAllPrograms();
  if (filters.type) programs = programs.filter((p) => p.program_type === filters.type);
  if (filters.level) programs = programs.filter((p) => p.level === filters.level);
  if (filters.format) programs = programs.filter((p) => p.format === filters.format);
  if (filters.is_free === true) programs = programs.filter((p) => p.is_free);
  if (filters.provider_slug) {
    programs = programs.filter((p) => p.provider?.slug === filters.provider_slug);
  }
  if (filters.tag_slug) {
    const tagProgramSlugs = getTagProgramSlugs(filters.tag_slug);
    programs = programs.filter((p) => tagProgramSlugs.has(p.slug));
  }
  if (filters.role_slug) {
    const roleProgramSlugs = getRoleProgramSlugs(filters.role_slug);
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

// ── Resources ──

export function getAllResources(): CHResource[] {
  return (resourcesData as Array<Record<string, unknown>>)
    .map((r) => {
      const provider = getProviderBySlug((r.provider_slug as string) ?? "");
      return {
        ...withId(r as unknown as CHResource),
        provider_id: provider?.id ?? null,
        provider,
      };
    })
    .filter((r) => r.is_active !== false);
}

export function getResourceBySlug(slug: string): CHResource | undefined {
  return getAllResources().find((r) => r.slug === slug);
}

// ── Junction helpers ──

function getTagProgramSlugs(tagSlug: string): Set<string> {
  return new Set(
    (programTagsData as Array<{ program_slug: string; tag_slug: string }>)
      .filter((pt) => pt.tag_slug === tagSlug)
      .map((pt) => pt.program_slug),
  );
}

function getRoleProgramSlugs(roleSlug: string): Set<string> {
  return new Set(
    (programRolesData as Array<{ program_slug: string; role_slug: string }>)
      .filter((pr) => pr.role_slug === roleSlug)
      .map((pr) => pr.program_slug),
  );
}

export function getProgramsForRole(roleSlug: string): CHProgram[] {
  const slugs = getRoleProgramSlugs(roleSlug);
  return getAllPrograms().filter((p) => slugs.has(p.slug));
}

export function getRolesForProgram(programSlug: string): CHRole[] {
  const roleSlugs = (programRolesData as Array<{ program_slug: string; role_slug: string }>)
    .filter((pr) => pr.program_slug === programSlug)
    .map((pr) => pr.role_slug);
  return getAllRoles().filter((r) => roleSlugs.includes(r.slug));
}

export function getTagsForProgram(programSlug: string): CHTag[] {
  const tagSlugs = (programTagsData as Array<{ program_slug: string; tag_slug: string }>)
    .filter((pt) => pt.program_slug === programSlug)
    .map((pt) => pt.tag_slug);
  return getAllCHTags().filter((t) => tagSlugs.includes(t.slug));
}

export function getProgramsForProvider(providerSlug: string): CHProgram[] {
  return getAllPrograms().filter((p) => p.provider?.slug === providerSlug);
}

export function getResourcesForProvider(providerSlug: string): CHResource[] {
  return getAllResources().filter((r) => r.provider?.slug === providerSlug);
}

export function getResourcesForRole(roleSlug: string): CHResource[] {
  const resourceSlugs = (roleResourcesData as Array<{ role_slug: string; resource_slug: string }>)
    .filter((rr) => rr.role_slug === roleSlug)
    .map((rr) => rr.resource_slug);
  return getAllResources().filter((r) => resourceSlugs.includes(r.slug));
}

export function getRecommendedProgramsForRole(
  roleSlug: string,
): CHRoleRecommendedProgram[] {
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
      program: getProgramBySlug(rp.program_slug),
    }));
}

export function getRoleProgressionPaths(
  roleSlug: string,
): CHRoleProgressionPath[] {
  return (
    roleProgressionPathsData as Array<{
      from_role_slug: string;
      to_role_slug: string;
      transition_summary: string;
      sort_order: number;
    }>
  )
    .filter((rp) => rp.from_role_slug === roleSlug)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((rp) => ({
      from_role_id: rp.from_role_slug,
      to_role_id: rp.to_role_slug,
      transition_summary: rp.transition_summary,
      sort_order: rp.sort_order,
      to_role: getRoleBySlug(rp.to_role_slug),
    }));
}

export function getRolesLeadingTo(roleSlug: string): CHRoleProgressionPath[] {
  return (
    roleProgressionPathsData as Array<{
      from_role_slug: string;
      to_role_slug: string;
      transition_summary: string;
      sort_order: number;
    }>
  )
    .filter((rp) => rp.to_role_slug === roleSlug)
    .map((rp) => ({
      from_role_id: rp.from_role_slug,
      to_role_id: rp.to_role_slug,
      transition_summary: rp.transition_summary,
      sort_order: rp.sort_order,
      from_role: getRoleBySlug(rp.from_role_slug),
    }));
}
