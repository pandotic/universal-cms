// ─── Hub Types ─────────────────────────────────────────────────────────────
// Types for the Pandotic Hub — cross-property mission control.
// Used by the fleet-dashboard and any consuming project that integrates with the Hub.

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Properties ────────────────────────────────────────────────────────────

export type PropertyType = "site" | "app";

export type PropertyStatus = "active" | "paused" | "archived" | "error";

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

export type BusinessCategory =
  | "saas"
  | "marketplace"
  | "directory"
  | "content_site"
  | "agency_client"
  | "internal_tool";

export type OwnershipType = "personal" | "pandotic" | "client";

export type BusinessStage = "idea" | "development" | "active" | "maintenance" | "sunset";

export type PlatformType = "nextjs_supabase" | "wordpress" | "static" | "mindpal" | "external" | "other";

export type OnboardingStatus = "pending" | "connecting" | "configuring" | "complete";

export interface HubProperty {
  id: string;
  name: string;
  slug: string;
  url: string;
  property_type: PropertyType;
  preset: string | null;
  enabled_modules: string[];
  supabase_project_ref: string | null;
  supabase_url: string | null;
  status: PropertyStatus;
  health_status: HealthStatus;
  last_deploy_at: string | null;
  ssl_valid: boolean;
  ssl_expires_at: string | null;
  metadata: Record<string, unknown>;
  // Business fields
  business_category: BusinessCategory | null;
  ownership_type: OwnershipType;
  client_name: string | null;
  business_stage: BusinessStage;
  domains: string[];
  domain_notes: string | null;
  llc_entity: string | null;
  business_notes: string | null;
  // Platform & onboarding
  platform_type: PlatformType;
  github_repo: string | null;
  github_default_branch: string;
  netlify_site_id: string | null;
  cms_installed: boolean;
  onboarding_status: OnboardingStatus;
  created_at: string;
  updated_at: string;
}

export type HubPropertyInsert = Omit<
  HubProperty,
  "id" | "created_at" | "updated_at" | "health_status" | "ssl_valid" | "metadata"
> & {
  health_status?: HealthStatus;
  ssl_valid?: boolean;
  metadata?: Record<string, unknown>;
};

export type HubPropertyUpdate = Partial<
  Omit<HubProperty, "id" | "created_at" | "updated_at">
>;

// ─── Users ─────────────────────────────────────────────────────────────────

export type HubRole = "super_admin" | "group_admin" | "member" | "viewer";

export interface HubUser {
  id: string;
  auth_user_id: string;
  display_name: string;
  email: string;
  hub_role: HubRole;
  avatar_url: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Activity Log ──────────────────────────────────────────────────────────

export interface HubActivityLogEntry {
  id: string;
  user_id: string | null;
  property_id: string | null;
  group_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Groups (Phase 2 — types defined now for forward compatibility) ───────

export type GroupType = "client" | "internal" | "custom";

export interface HubGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group_type: GroupType;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HubUserGroupAccess {
  user_id: string;
  group_id: string;
  role: "group_admin" | "member" | "viewer";
  granted_at: string;
  granted_by: string | null;
}

// ─── Filters ───────────────────────────────────────────────────────────────

export interface PropertyFilters {
  type?: PropertyType;
  status?: PropertyStatus;
  healthStatus?: HealthStatus;
  groupId?: string;
  ownershipType?: OwnershipType;
  businessStage?: BusinessStage;
  businessCategory?: BusinessCategory;
  platformType?: PlatformType;
}

export interface ActivityFilters {
  propertyId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}
