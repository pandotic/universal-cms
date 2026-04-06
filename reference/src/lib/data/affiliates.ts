import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AffiliateNetwork =
  | "amazon"
  | "shareasale"
  | "cj"
  | "rakuten"
  | "impact"
  | "partnerstack"
  | "direct"
  | "custom";

export interface AffiliateProgram {
  id: string;
  name: string;
  network: AffiliateNetwork;
  merchant_name: string | null;
  base_url: string | null;
  tracking_template: string | null;
  tracking_id: string | null;
  commission_text: string | null;
  cookie_duration_days: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  program_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  destination_url: string;
  tracking_url: string | null;
  placement: string | null;
  created_at: string;
}

export async function getAllAffiliatePrograms(): Promise<AffiliateProgram[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("affiliate_programs")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getAffiliateProgram(
  id: string
): Promise<AffiliateProgram | null> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("affiliate_programs")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createAffiliateProgram(
  program: Partial<AffiliateProgram>
): Promise<AffiliateProgram> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("affiliate_programs")
    .insert(program)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAffiliateProgram(
  id: string,
  updates: Partial<AffiliateProgram>
): Promise<AffiliateProgram> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("affiliate_programs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAffiliateProgram(id: string): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("affiliate_programs")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function buildTrackingUrl(
  program: AffiliateProgram,
  destinationUrl: string
): string {
  if (!program.tracking_template) return destinationUrl;

  return program.tracking_template
    .replace("{url}", encodeURIComponent(destinationUrl))
    .replace("{tracking_id}", program.tracking_id ?? "")
    .replace("{merchant}", program.merchant_name ?? "");
}
