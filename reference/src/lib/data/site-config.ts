import siteConfig from "@/data/site-config.json";

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
export async function getNavigationPrimary(): Promise<any[]> {
  if (!sbReady()) return siteConfig.navigation.primary;

  const sb = await getClient();
  const { data } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "navigation_primary")
    .single();

  const nav = data?.value as unknown[];
  // Fall back to JSON if DB has empty array (initial seed)
  if (!nav || (Array.isArray(nav) && nav.length === 0)) {
    return siteConfig.navigation.primary;
  }
  return nav;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getFooterSections(): Promise<any[]> {
  if (!sbReady()) return siteConfig.footer.sections;

  const sb = await getClient();
  const { data } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "footer_sections")
    .single();

  const sections = data?.value as unknown[];
  if (!sections || (Array.isArray(sections) && sections.length === 0)) {
    return siteConfig.footer.sections;
  }
  return sections;
}

export async function getSiteMetadata(): Promise<{
  siteName: string;
  siteUrl: string;
  tagline: string;
  description: string;
}> {
  // These rarely change — use JSON, could move to site_settings later
  return {
    siteName: siteConfig.siteName,
    siteUrl: siteConfig.siteUrl,
    tagline: siteConfig.tagline,
    description: siteConfig.description,
  };
}
