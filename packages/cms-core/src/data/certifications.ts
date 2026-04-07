import type { SupabaseClient } from "@supabase/supabase-js";

export type CertificationRuleType =
  | "score_threshold"
  | "attribute_match"
  | "manual_override"
  | "tag_required";

export interface CmsCertification {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badge_image: string | null;
  criteria_text: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CertificationRule {
  id: string;
  certification_id: string;
  rule_type: CertificationRuleType;
  config: Record<string, unknown>;
  created_at: string;
}

export interface EntityCertification {
  id: string;
  entity_type: string;
  entity_id: string;
  certification_id: string;
  awarded_at: string;
  expires_at: string | null;
  awarded_by: string | null;
  notes: string | null;
  certification?: CmsCertification;
}

export async function getAllCertifications(
  client: SupabaseClient
): Promise<CmsCertification[]> {
  const { data, error } = await client
    .from("cms_certifications")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getCertificationWithRules(
  client: SupabaseClient,
  id: string
): Promise<{
  certification: CmsCertification;
  rules: CertificationRule[];
} | null> {
  const { data: cert, error } = await client
    .from("cms_certifications")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!cert) return null;

  const { data: rules, error: rulesError } = await client
    .from("certification_rules")
    .select("*")
    .eq("certification_id", id);

  if (rulesError) throw rulesError;

  return { certification: cert, rules: rules ?? [] };
}

export async function createCertification(
  client: SupabaseClient,
  cert: Partial<CmsCertification>
): Promise<CmsCertification> {
  const { data, error } = await client
    .from("cms_certifications")
    .insert(cert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCertification(
  client: SupabaseClient,
  id: string,
  updates: Partial<CmsCertification>
): Promise<CmsCertification> {
  const { data, error } = await client
    .from("cms_certifications")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCertification(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from("cms_certifications")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function addCertificationRule(
  client: SupabaseClient,
  rule: Partial<CertificationRule>
): Promise<CertificationRule> {
  const { data, error } = await client
    .from("certification_rules")
    .insert(rule)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCertificationRule(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from("certification_rules")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getEntityCertifications(
  client: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<EntityCertification[]> {
  const { data, error } = await client
    .from("entity_certifications")
    .select("*, certification:cms_certifications(*)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) throw error;
  return data ?? [];
}

export async function awardCertification(
  client: SupabaseClient,
  entry: {
    entity_type: string;
    entity_id: string;
    certification_id: string;
    awarded_by?: string;
    notes?: string;
    expires_at?: string;
  }
): Promise<EntityCertification> {
  const { data, error } = await client
    .from("entity_certifications")
    .upsert(entry, {
      onConflict: "entity_type,entity_id,certification_id",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
