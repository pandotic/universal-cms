import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Project,
  ProjectSection,
  ProjectWithContent,
  SectionType,
} from "../types/projects.js";
import {
  parseFeatures,
  parseProofPoints,
  parseTechDifferentiators,
  parseProductPage,
  parseCaseStudy,
  parseBlurbs,
  parsePortfolio,
} from "./project-parsers.js";

// ─── Projects CRUD ──────────────────────────────────────────────────────────

export async function getAllProjects(
  client: SupabaseClient,
): Promise<Project[]> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(addHasDetailPage);
}

export async function getPublishedProjects(
  client: SupabaseClient,
): Promise<Project[]> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(addHasDetailPage);
}

export async function getProjectBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<Project | null> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ? addHasDetailPage(data) : null;
}

export async function getProjectById(
  client: SupabaseClient,
  id: string,
): Promise<Project | null> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ? addHasDetailPage(data) : null;
}

export async function createProject(
  client: SupabaseClient,
  project: Partial<Project>,
): Promise<Project> {
  const { data, error } = await client
    .from("projects")
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return addHasDetailPage(data);
}

export async function updateProject(
  client: SupabaseClient,
  id: string,
  updates: Partial<Project>,
): Promise<Project> {
  const { data, error } = await client
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return addHasDetailPage(data);
}

export async function deleteProject(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ─── Project Sections CRUD ──────────────────────────────────────────────────

export async function getProjectSections(
  client: SupabaseClient,
  projectId: string,
): Promise<ProjectSection[]> {
  const { data, error } = await client
    .from("project_sections")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProjectSection(
  client: SupabaseClient,
  projectId: string,
  sectionType: SectionType,
): Promise<ProjectSection | null> {
  const { data, error } = await client
    .from("project_sections")
    .select("*")
    .eq("project_id", projectId)
    .eq("section_type", sectionType)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertProjectSection(
  client: SupabaseClient,
  section: Partial<ProjectSection> & { project_id: string; section_type: SectionType },
): Promise<ProjectSection> {
  const { data, error } = await client
    .from("project_sections")
    .upsert(section, { onConflict: "project_id,section_type" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProjectSection(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client
    .from("project_sections")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── Full project with parsed content ───────────────────────────────────────

export async function getProjectWithContent(
  client: SupabaseClient,
  slug: string,
): Promise<ProjectWithContent | null> {
  const project = await getProjectBySlug(client, slug);
  if (!project) return null;

  const sections = await getProjectSections(client, project.id);

  const sectionContent = (type: SectionType): string => {
    const s = sections.find((sec) => sec.section_type === type);
    return s?.content || "";
  };

  return {
    ...project,
    productPage: parseProductPage(sectionContent("product-page")),
    caseStudy: parseCaseStudy(sectionContent("case-study")),
    features: parseFeatures(sectionContent("features")),
    proofPoints: parseProofPoints(sectionContent("proof-points")),
    techDifferentiators: parseTechDifferentiators(sectionContent("tech-differentiators")),
    blurbs: parseBlurbs(sectionContent("blurbs")),
    portfolio: parsePortfolio(sectionContent("portfolio")),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function addHasDetailPage(row: Record<string, unknown>): Project {
  return { ...row, has_detail_page: true } as Project;
}
