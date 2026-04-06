import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CtaBlockStatus = "draft" | "active" | "archived";

export interface CtaBlock {
  id: string;
  name: string;
  slug: string;
  placement: string;
  heading: string;
  subheading: string | null;
  primary_button_text: string | null;
  primary_button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  background_style: string;
  background_image_url: string | null;
  form_id: string | null;
  status: CtaBlockStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Hardcoded fallback for when Supabase is not configured ──────────────────

const FALLBACK_CTA_BLOCKS: CtaBlock[] = [
  {
    id: "fallback-1",
    name: "ESG Score Assessment",
    slug: "esg-score-cta",
    placement: "homepage",
    heading: "Get Your Free ESG Score",
    subheading:
      "Answer 30 questions across Environmental, Social, and Governance categories to get your organization\u2019s ESG score with personalized recommendations. Takes about 10 minutes.",
    primary_button_text: "Start the Assessment",
    primary_button_url: "/score",
    secondary_button_text: "ESG for Small Business",
    secondary_button_url: "/small-business",
    background_style: "gradient",
    background_image_url:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
    form_id: null,
    status: "active",
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    name: "Find Your Solution",
    slug: "find-solution-cta",
    placement: "homepage",
    heading: "Not sure where to start? Let us help.",
    subheading:
      "Answer 5 quick questions and get personalized recommendations for ESG software, consulting partners, and frameworks that match your needs.",
    primary_button_text: "Find Your ESG Solution",
    primary_button_url: "/find",
    secondary_button_text: "Browse the Glossary",
    secondary_button_url: "/glossary",
    background_style: "dark",
    background_image_url:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80",
    form_id: null,
    status: "active",
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let _sbConfigured: boolean | null = null;
function sbReady(): boolean {
  if (_sbConfigured !== null) return _sbConfigured;
  _sbConfigured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return _sbConfigured;
}

// ── Public queries ──────────────────────────────────────────────────────────

export async function getCtaBlocksByPlacement(
  placement: string
): Promise<CtaBlock[]> {
  if (!sbReady()) {
    return FALLBACK_CTA_BLOCKS.filter((b) => b.placement === placement);
  }

  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cta_blocks")
    .select("*")
    .eq("placement", placement)
    .eq("status", "active")
    .order("sort_order");

  if (error) return FALLBACK_CTA_BLOCKS.filter((b) => b.placement === placement);
  return data?.length ? data : FALLBACK_CTA_BLOCKS.filter((b) => b.placement === placement);
}

// ── Admin CRUD ──────────────────────────────────────────────────────────────

export async function getAllCtaBlocks(): Promise<CtaBlock[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cta_blocks")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getCtaBlockById(id: string): Promise<CtaBlock | null> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cta_blocks")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createCtaBlock(
  block: Partial<CtaBlock>
): Promise<CtaBlock> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cta_blocks")
    .insert(block)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCtaBlock(
  id: string,
  updates: Partial<CtaBlock>
): Promise<CtaBlock> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cta_blocks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCtaBlock(id: string): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("cta_blocks")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
