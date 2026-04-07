import smbData from "@/data/smb-esg-content.json";

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
export async function getSmbContent(): Promise<any> {
  if (!sbReady()) return smbData;

  const sb = await getClient();
  const { data } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "smb_esg_content")
    .single();

  return (data?.value as Record<string, unknown>) ?? smbData;
}
