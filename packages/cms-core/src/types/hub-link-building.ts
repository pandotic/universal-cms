// ─── Link Building Types ──────────────────────────────────────────────────
// Link opportunities, submissions, and Featured.com tracking.

export type LinkPriority = "tier_1" | "tier_2" | "tier_3";

export type LinkSubmissionStatus =
  | "queued"
  | "submitted"
  | "pending"
  | "verified"
  | "live"
  | "rejected"
  | "failed";

// ─── Link Opportunities (shared catalog) ────────────────────────────────

export interface HubLinkOpportunity {
  id: string;
  name: string;
  url: string;
  category: string | null;
  industry: string[];
  domain_authority: number | null;
  priority: LinkPriority | null;
  submission_method: string | null;
  notes: string | null;
  created_at: string;
}

export type HubLinkOpportunityInsert = Omit<
  HubLinkOpportunity,
  "id" | "created_at"
>;

export type HubLinkOpportunityUpdate = Partial<
  Omit<HubLinkOpportunity, "id" | "created_at">
>;

// ─── Link Submissions (per-property) ────────────────────────────────────

export interface HubLinkSubmission {
  id: string;
  property_id: string;
  opportunity_id: string;
  status: LinkSubmissionStatus;
  submitted_url: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  last_checked_at: string | null;
  is_live: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type HubLinkSubmissionInsert = Omit<
  HubLinkSubmission,
  "id" | "created_at" | "updated_at"
>;

export type HubLinkSubmissionUpdate = Partial<
  Omit<HubLinkSubmission, "id" | "property_id" | "opportunity_id" | "created_at">
>;

// ─── Featured.com Outbound ──────────────────────────────────────────────

export interface HubFeaturedOutboundPitch {
  id: string;
  property_id: string | null;
  question: string | null;
  answer: string | null;
  publication: string | null;
  status: string | null;
  pitched_at: string | null;
  published_url: string | null;
  created_at: string;
  updated_at: string;
}

export type HubFeaturedOutboundPitchInsert = Omit<
  HubFeaturedOutboundPitch,
  "id" | "created_at" | "updated_at"
>;

export type HubFeaturedOutboundPitchUpdate = Partial<
  Omit<HubFeaturedOutboundPitch, "id" | "created_at">
>;

// ─── Featured.com Inbound ───────────────────────────────────────────────

export interface HubFeaturedInboundSubmission {
  id: string;
  property_id: string | null;
  contributor_email: string | null;
  pitch_summary: string | null;
  status: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export type HubFeaturedInboundSubmissionInsert = Omit<
  HubFeaturedInboundSubmission,
  "id" | "created_at" | "updated_at"
>;

export type HubFeaturedInboundSubmissionUpdate = Partial<
  Omit<HubFeaturedInboundSubmission, "id" | "created_at">
>;

// ─── Filters ────────────────────────────────────────────────────────────

export interface LinkOpportunityFilters {
  category?: string;
  priority?: LinkPriority;
  limit?: number;
  offset?: number;
}

export interface LinkSubmissionFilters {
  propertyId?: string;
  opportunityId?: string;
  status?: LinkSubmissionStatus;
  limit?: number;
  offset?: number;
}

export interface LinkBuildingStats {
  totalOpportunities: number;
  totalSubmissions: number;
  liveLinks: number;
  pendingSubmissions: number;
  byStatus: Record<string, number>;
}
