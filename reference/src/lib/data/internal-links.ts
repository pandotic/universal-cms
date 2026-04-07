import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface InternalLinkStat {
  pagePath: string;
  inboundCount: number;
  outboundCount: number;
}

export interface LinkSuggestion {
  id: string;
  source_page: string;
  target_page: string;
  target_title: string | null;
  suggested_anchor: string | null;
  relevance_score: number;
  status: "pending" | "accepted" | "dismissed";
  created_at: string;
}

export interface InternalLink {
  id: string;
  source_page: string;
  target_page: string;
  anchor_text: string | null;
  link_type: string;
  context_snippet: string | null;
  created_at: string;
}

export async function getInternalLinkStats(): Promise<InternalLinkStat[]> {
  const sb = await getSupabaseAdmin();

  const [{ data: outbound }, { data: inbound }] = await Promise.all([
    sb.from("internal_links").select("source_page"),
    sb.from("internal_links").select("target_page"),
  ]);

  const outboundMap = new Map<string, number>();
  for (const row of outbound ?? []) {
    outboundMap.set(row.source_page, (outboundMap.get(row.source_page) ?? 0) + 1);
  }

  const inboundMap = new Map<string, number>();
  for (const row of inbound ?? []) {
    inboundMap.set(row.target_page, (inboundMap.get(row.target_page) ?? 0) + 1);
  }

  // Merge both maps into a single set of pages
  const allPages = new Set([...outboundMap.keys(), ...inboundMap.keys()]);

  return Array.from(allPages).map((pagePath) => ({
    pagePath,
    inboundCount: inboundMap.get(pagePath) ?? 0,
    outboundCount: outboundMap.get(pagePath) ?? 0,
  }));
}

export async function getOrphanPages(allPagePaths: string[]): Promise<string[]> {
  if (allPagePaths.length === 0) return [];

  const sb = await getSupabaseAdmin();
  const { data } = await sb
    .from("internal_links")
    .select("target_page")
    .in("target_page", allPagePaths);

  const linked = new Set((data ?? []).map((r) => r.target_page));
  return allPagePaths.filter((p) => !linked.has(p));
}

export async function getLinkSuggestions(
  status?: "pending" | "accepted" | "dismissed"
): Promise<LinkSuggestion[]> {
  const sb = await getSupabaseAdmin();
  let query = sb
    .from("link_suggestions")
    .select("*")
    .order("relevance_score", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateLinkSuggestion(
  id: string,
  status: "accepted" | "dismissed"
): Promise<void> {
  const sb = await getSupabaseAdmin();
  const { error } = await sb
    .from("link_suggestions")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function recordInternalLink(link: {
  source_page: string;
  target_page: string;
  anchor_text?: string;
  link_type?: string;
  context_snippet?: string;
}): Promise<void> {
  const sb = await getSupabaseAdmin();
  const { error } = await sb.from("internal_links").upsert(
    {
      source_page: link.source_page,
      target_page: link.target_page,
      anchor_text: link.anchor_text ?? null,
      link_type: link.link_type ?? "content",
      context_snippet: link.context_snippet ?? null,
    },
    { onConflict: "source_page,target_page,anchor_text" }
  );
  if (error) throw error;
}

export async function getAnchorTextGroups(): Promise<
  { target_page: string; anchor_text: string; count: number }[]
> {
  const sb = await getSupabaseAdmin();
  const { data, error } = await sb
    .from("internal_links")
    .select("target_page, anchor_text")
    .not("anchor_text", "is", null);

  if (error) throw error;

  // Group by target_page + anchor_text
  const grouped = new Map<string, number>();
  for (const row of data ?? []) {
    const key = `${row.target_page}|||${row.anchor_text}`;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return Array.from(grouped.entries()).map(([key, count]) => {
    const [target_page, anchor_text] = key.split("|||");
    return { target_page, anchor_text, count };
  });
}
