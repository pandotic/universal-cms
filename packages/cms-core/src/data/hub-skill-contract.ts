import type { SupabaseClient } from "@supabase/supabase-js";
import type { HubProperty } from "../types/hub";
import type { BrandVoiceBrief } from "../types/social";
import type { HubBrandAsset } from "../types/hub-brand-assets";
import type { HubContentPipelineItemInsert } from "../types/hub-content-pipeline";
import type { HubContentQAReviewInsert } from "../types/hub-qa";

export interface SkillPrereqResult {
  allowed: boolean;
  reason?: string;
  property: HubProperty | null;
  brandVoice: BrandVoiceBrief | null;
  brandAssets: HubBrandAsset | null;
}

export async function checkSkillPrereqs(
  client: SupabaseClient,
  propertyId: string
): Promise<SkillPrereqResult> {
  const { data: property, error: propError } = await client
    .from("hub_properties")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();

  if (propError) throw propError;

  if (!property) {
    return { allowed: false, reason: "Property not found", property: null, brandVoice: null, brandAssets: null };
  }

  if (property.kill_switch) {
    return { allowed: false, reason: "Kill switch is active", property, brandVoice: null, brandAssets: null };
  }

  if (property.business_stage !== "active") {
    return { allowed: false, reason: `Property stage is '${property.business_stage}', not 'active'`, property, brandVoice: null, brandAssets: null };
  }

  const [briefRes, assetsRes] = await Promise.all([
    client
      .from("hub_brand_voice_briefs")
      .select("*")
      .eq("property_id", propertyId)
      .limit(1)
      .maybeSingle(),
    client
      .from("hub_brand_assets")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle(),
  ]);

  if (briefRes.error) throw briefRes.error;
  if (assetsRes.error) throw assetsRes.error;

  return {
    allowed: true,
    property,
    brandVoice: briefRes.data,
    brandAssets: assetsRes.data,
  };
}

export async function submitToContentPipeline(
  client: SupabaseClient,
  item: HubContentPipelineItemInsert
): Promise<{ id: string }> {
  const { data, error } = await client
    .from("hub_content_pipeline")
    .insert({ ...item, status: item.status ?? "drafted" })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function requestQAReview(
  client: SupabaseClient,
  contentId: string,
  contentTable: string,
  agentName: string
): Promise<{ id: string }> {
  const review: HubContentQAReviewInsert = {
    content_id: contentId,
    content_table: contentTable,
    reviewer_agent: agentName,
    overall_confidence: null,
    status: null,
    checks: null,
    suggested_fixes: [],
    human_override: false,
    override_reason: null,
  };

  const { data, error } = await client
    .from("hub_content_qa_reviews")
    .insert(review)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
