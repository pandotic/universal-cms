import brandGuideData from "@/data/brand-guide.json";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getBrandGuide(): Promise<any> {
  if (!sbReady()) return brandGuideData;

  const sb = await getClient();
  const { data } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "brand_guide")
    .single();

  const guide = data?.value as Record<string, unknown>;
  if (!guide || Object.keys(guide).length === 0) return brandGuideData;
  return guide;
}
