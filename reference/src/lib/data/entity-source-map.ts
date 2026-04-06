import sourceMapData from "@/data/entity-source-map.json";

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

export interface SourceMapEntry {
  source_name: string;
  source_url: string;
  search_query_footprint?: string;
  app_store_id?: string;
}

export type EntitySourceMap = Record<string, SourceMapEntry[]>;

export async function getEntitySourceMap(): Promise<EntitySourceMap> {
  if (!sbReady()) return sourceMapData as unknown as EntitySourceMap;

  const sb = await getClient();
  const { data } = await sb
    .from("entity_source_map")
    .select("*")
    .order("entity_slug");

  if (!data || data.length === 0) return sourceMapData as unknown as EntitySourceMap;

  const map: EntitySourceMap = {};
  for (const row of data) {
    if (!map[row.entity_slug]) map[row.entity_slug] = [];
    map[row.entity_slug].push({
      source_name: row.source_name,
      source_url: row.source_url,
      search_query_footprint: row.search_query_footprint ?? undefined,
      app_store_id: row.app_store_id ?? undefined,
    });
  }
  return map;
}

export async function getSourcesForEntity(
  entitySlug: string,
): Promise<SourceMapEntry[]> {
  if (!sbReady()) {
    const map = sourceMapData as unknown as EntitySourceMap;
    return map[entitySlug] ?? [];
  }

  const sb = await getClient();
  const { data } = await sb
    .from("entity_source_map")
    .select("*")
    .eq("entity_slug", entitySlug);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    source_name: row.source_name as string,
    source_url: row.source_url as string,
    search_query_footprint: row.search_query_footprint as string | undefined,
    app_store_id: row.app_store_id as string | undefined,
  }));
}
