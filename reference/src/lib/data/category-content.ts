import contentData from "@/data/category-content.json";
import type { CategoryContent } from "@/lib/types/category-content";
import { toCategoryContent } from "./utils/map-fields";

const jsonData = contentData as Record<string, CategoryContent>;

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

export async function getCategoryContent(
  categoryId: string,
): Promise<CategoryContent | undefined> {
  if (!sbReady()) return jsonData[categoryId];
  const sb = await getClient();
  const { data } = await sb
    .from("category_content")
    .select("*")
    .eq("category_id", categoryId)
    .single();
  return data ? toCategoryContent(data) : undefined;
}
