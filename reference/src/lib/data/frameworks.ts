import frameworksData from "@/data/frameworks.json";
import { Framework, FrameworkType } from "@/lib/types/framework";
import { toFramework } from "./utils/map-fields";

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

export async function getAllFrameworks(): Promise<Framework[]> {
  if (!sbReady()) return (frameworksData as Framework[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const sb = await getClient();
  const { data } = await sb.from("frameworks").select("*").order("sort_order");
  return (data ?? []).map(toFramework);
}

export async function getFrameworkBySlug(slug: string): Promise<Framework | undefined> {
  if (!sbReady()) return (frameworksData as Framework[]).find((f) => f.slug === slug);
  const sb = await getClient();
  const { data } = await sb.from("frameworks").select("*").eq("slug", slug).single();
  return data ? toFramework(data) : undefined;
}

export async function getFrameworkById(id: string): Promise<Framework | undefined> {
  if (!sbReady()) return (frameworksData as Framework[]).find((f) => f.id === id);
  const sb = await getClient();
  const { data } = await sb.from("frameworks").select("*").eq("id", id).single();
  return data ? toFramework(data) : undefined;
}

export async function getFrameworksByType(type: FrameworkType): Promise<Framework[]> {
  if (!sbReady()) return (frameworksData as Framework[]).filter((f) => f.type === type);
  const sb = await getClient();
  const { data } = await sb.from("frameworks").select("*").eq("type", type).order("sort_order");
  return (data ?? []).map(toFramework);
}

export async function getFrameworksByRegion(region: string): Promise<Framework[]> {
  if (!sbReady()) return (frameworksData as Framework[]).filter((f) => f.region === region);
  const sb = await getClient();
  const { data } = await sb.from("frameworks").select("*").eq("region", region).order("sort_order");
  return (data ?? []).map(toFramework);
}

export async function getFrameworkSlugs(): Promise<string[]> {
  if (!sbReady()) return (frameworksData as Framework[]).map((f) => f.slug);
  const sb = await getClient();
  const { data } = await sb.from("frameworks").select("slug");
  return (data ?? []).map((r) => r.slug);
}

export async function getRelatedFrameworks(frameworkId: string): Promise<Framework[]> {
  const framework = await getFrameworkById(frameworkId);
  if (!framework) return [];
  const all = await getAllFrameworks();
  return all.filter((f) => framework.relatedFrameworkIds.includes(f.id));
}
