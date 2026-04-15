// ─── Hub Marketing Service Types ───────────────────────────────────────────
// Tracks marketing services assigned to fleet properties.

export type MarketingServiceType =
  | "seo"
  | "content"
  | "social"
  | "paid_ads"
  | "email"
  | "analytics"
  | "branding"
  | "pr";

export type MarketingServiceStatus = "planned" | "active" | "paused" | "completed";

export interface HubMarketingService {
  id: string;
  property_id: string;
  service_type: MarketingServiceType;
  status: MarketingServiceStatus;
  provider: string;
  notes: string | null;
  started_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type HubMarketingServiceInsert = Omit<
  HubMarketingService,
  "id" | "created_at" | "updated_at"
>;

export type HubMarketingServiceUpdate = Partial<
  Omit<HubMarketingService, "id" | "property_id" | "created_at" | "updated_at">
>;

export interface MarketingServiceFilters {
  propertyId?: string;
  serviceType?: MarketingServiceType;
  status?: MarketingServiceStatus;
}
