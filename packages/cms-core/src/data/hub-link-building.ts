import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubLinkOpportunity,
  HubLinkOpportunityInsert,
  HubLinkOpportunityUpdate,
  HubLinkSubmission,
  HubLinkSubmissionInsert,
  HubLinkSubmissionUpdate,
  HubFeaturedOutboundPitch,
  HubFeaturedOutboundPitchInsert,
  HubFeaturedOutboundPitchUpdate,
  HubFeaturedInboundSubmission,
  HubFeaturedInboundSubmissionInsert,
  HubFeaturedInboundSubmissionUpdate,
  LinkOpportunityFilters,
  LinkSubmissionFilters,
  LinkBuildingStats,
} from "../types/hub-link-building";

// ─── Link Opportunities ─────────────────────────────────────────────────

const OPPS_TABLE = "hub_link_opportunities";

export async function listLinkOpportunities(
  client: SupabaseClient,
  filters?: LinkOpportunityFilters
): Promise<HubLinkOpportunity[]> {
  let query = client.from(OPPS_TABLE).select("*");
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.priority) query = query.eq("priority", filters.priority);

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("priority")
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function getLinkOpportunityById(
  client: SupabaseClient,
  id: string
): Promise<HubLinkOpportunity | null> {
  const { data, error } = await client.from(OPPS_TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createLinkOpportunity(
  client: SupabaseClient,
  opp: HubLinkOpportunityInsert
): Promise<HubLinkOpportunity> {
  const { data, error } = await client.from(OPPS_TABLE).insert(opp).select().single();
  if (error) throw error;
  return data;
}

export async function updateLinkOpportunity(
  client: SupabaseClient,
  id: string,
  updates: HubLinkOpportunityUpdate
): Promise<HubLinkOpportunity> {
  const { data, error } = await client.from(OPPS_TABLE).update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLinkOpportunity(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(OPPS_TABLE).delete().eq("id", id);
  if (error) throw error;
}

// ─── Link Submissions ───────────────────────────────────────────────────

const SUBS_TABLE = "hub_link_submissions";

export async function listLinkSubmissions(
  client: SupabaseClient,
  filters?: LinkSubmissionFilters
): Promise<HubLinkSubmission[]> {
  let query = client.from(SUBS_TABLE).select("*");
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.opportunityId) query = query.eq("opportunity_id", filters.opportunityId);
  if (filters?.status) query = query.eq("status", filters.status);

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function createLinkSubmission(
  client: SupabaseClient,
  sub: HubLinkSubmissionInsert
): Promise<HubLinkSubmission> {
  const { data, error } = await client.from(SUBS_TABLE).insert(sub).select().single();
  if (error) throw error;
  return data;
}

export async function updateLinkSubmission(
  client: SupabaseClient,
  id: string,
  updates: HubLinkSubmissionUpdate
): Promise<HubLinkSubmission> {
  const { data, error } = await client
    .from(SUBS_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLinkBuildingStats(
  client: SupabaseClient,
  propertyId: string
): Promise<LinkBuildingStats> {
  const [oppsRes, subsRes] = await Promise.all([
    client.from(OPPS_TABLE).select("id", { count: "exact", head: true }),
    client.from(SUBS_TABLE).select("status, is_live").eq("property_id", propertyId),
  ]);

  if (oppsRes.error) throw oppsRes.error;
  if (subsRes.error) throw subsRes.error;

  const stats: LinkBuildingStats = {
    totalOpportunities: oppsRes.count ?? 0,
    totalSubmissions: subsRes.data?.length ?? 0,
    liveLinks: 0,
    pendingSubmissions: 0,
    byStatus: {},
  };

  for (const sub of subsRes.data ?? []) {
    const status = sub.status as string;
    stats.byStatus[status] = (stats.byStatus[status] ?? 0) + 1;
    if (sub.is_live) stats.liveLinks += 1;
    if (status === "queued" || status === "submitted" || status === "pending") {
      stats.pendingSubmissions += 1;
    }
  }

  return stats;
}

// ─── Featured.com Outbound ──────────────────────────────────────────────

const OUTBOUND_TABLE = "hub_featured_outbound_pitches";

export async function listFeaturedOutboundPitches(
  client: SupabaseClient,
  propertyId?: string
): Promise<HubFeaturedOutboundPitch[]> {
  let query = client.from(OUTBOUND_TABLE).select("*");
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createFeaturedOutboundPitch(
  client: SupabaseClient,
  pitch: HubFeaturedOutboundPitchInsert
): Promise<HubFeaturedOutboundPitch> {
  const { data, error } = await client.from(OUTBOUND_TABLE).insert(pitch).select().single();
  if (error) throw error;
  return data;
}

export async function updateFeaturedOutboundPitch(
  client: SupabaseClient,
  id: string,
  updates: HubFeaturedOutboundPitchUpdate
): Promise<HubFeaturedOutboundPitch> {
  const { data, error } = await client
    .from(OUTBOUND_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Featured.com Inbound ───────────────────────────────────────────────

const INBOUND_TABLE = "hub_featured_inbound_submissions";

export async function listFeaturedInboundSubmissions(
  client: SupabaseClient,
  propertyId?: string
): Promise<HubFeaturedInboundSubmission[]> {
  let query = client.from(INBOUND_TABLE).select("*");
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createFeaturedInboundSubmission(
  client: SupabaseClient,
  submission: HubFeaturedInboundSubmissionInsert
): Promise<HubFeaturedInboundSubmission> {
  const { data, error } = await client.from(INBOUND_TABLE).insert(submission).select().single();
  if (error) throw error;
  return data;
}

export async function updateFeaturedInboundSubmission(
  client: SupabaseClient,
  id: string,
  updates: HubFeaturedInboundSubmissionUpdate
): Promise<HubFeaturedInboundSubmission> {
  const { data, error } = await client
    .from(INBOUND_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
