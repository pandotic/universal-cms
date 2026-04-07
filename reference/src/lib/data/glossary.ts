import glossaryData from "@/data/glossary.json";
import { GlossaryTerm } from "@/lib/types/glossary";
import { toGlossaryTerm } from "./utils/map-fields";

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

export async function getAllGlossaryTerms(): Promise<GlossaryTerm[]> {
  if (!sbReady())
    return (glossaryData as GlossaryTerm[]).sort((a, b) => a.term.localeCompare(b.term));
  const sb = await getClient();
  const { data } = await sb.from("glossary_terms").select("*").order("term");
  return (data ?? []).map(toGlossaryTerm);
}

export async function getGlossaryTermBySlug(slug: string): Promise<GlossaryTerm | undefined> {
  if (!sbReady()) return (glossaryData as GlossaryTerm[]).find((t) => t.slug === slug);
  const sb = await getClient();
  const { data } = await sb.from("glossary_terms").select("*").eq("slug", slug).single();
  return data ? toGlossaryTerm(data) : undefined;
}

export async function getGlossaryTermById(id: string): Promise<GlossaryTerm | undefined> {
  if (!sbReady()) return (glossaryData as GlossaryTerm[]).find((t) => t.id === id);
  const sb = await getClient();
  const { data } = await sb.from("glossary_terms").select("*").eq("id", id).single();
  return data ? toGlossaryTerm(data) : undefined;
}

export async function getGlossaryTermsByCategory(categoryId: string): Promise<GlossaryTerm[]> {
  if (!sbReady())
    return (glossaryData as GlossaryTerm[]).filter((t) => t.categoryIds.includes(categoryId));
  const sb = await getClient();
  const { data } = await sb
    .from("glossary_terms")
    .select("*")
    .contains("category_ids", [categoryId])
    .order("term");
  return (data ?? []).map(toGlossaryTerm);
}

export async function getGlossaryTermsByLetter(letter: string): Promise<GlossaryTerm[]> {
  const all = await getAllGlossaryTerms();
  return all.filter((t) => t.term.toUpperCase().startsWith(letter.toUpperCase()));
}

export async function getGlossaryTermsGroupedByLetter(): Promise<Record<string, GlossaryTerm[]>> {
  const all = await getAllGlossaryTerms();
  const groups: Record<string, GlossaryTerm[]> = {};
  for (const term of all) {
    const letter = term.term[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(term);
  }
  return groups;
}

export async function getGlossarySlugs(): Promise<string[]> {
  if (!sbReady()) return (glossaryData as GlossaryTerm[]).map((t) => t.slug);
  const sb = await getClient();
  const { data } = await sb.from("glossary_terms").select("slug");
  return (data ?? []).map((r) => r.slug);
}

export async function getRelatedTerms(termId: string): Promise<GlossaryTerm[]> {
  const term = await getGlossaryTermById(termId);
  if (!term) return [];
  const all = await getAllGlossaryTerms();
  return all.filter((t) => term.relatedTermIds.includes(t.id));
}
