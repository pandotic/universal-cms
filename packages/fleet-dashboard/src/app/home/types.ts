export type Lens = "overview" | "developer" | "marketing" | "business";
export type OwnerFilter = "all" | "personal" | "pandotic" | "client";
export type Density = "compact" | "comfortable";

export type SortDir = "asc" | "desc";
export type SortConfig = { key: string; dir: SortDir } | null;

export interface Property {
  id: string;
  name: string;
  slug: string;
  url: string;
  status: string;
  health_status: "healthy" | "degraded" | "down" | "unknown";
  ownership_type: "personal" | "pandotic" | "client";
  client_name: string | null;
  business_stage: "idea" | "development" | "active" | "maintenance" | "sunset";
  business_category: string | null;
  enabled_modules: string[];
  domains: string[];
  llc_entity: string | null;
  last_deploy_at: string | null;
  last_health_check_at?: string | null;
  cms_installed: boolean;
  onboarding_status: string;
  github_repo: string | null;
  netlify_site_id: string | null;
  platform_type: string;
}

export interface Deployment {
  id: string;
  property_id: string;
  package_name: string;
  package_category: string;
  installed_version: string | null;
  latest_version: string | null;
  pinned: boolean;
  status: string;
  enabled_modules: string[];
  bespoke_modules?: string[];
  last_health_check_at?: string | null;
}

export interface SkillCount {
  property_id: string;
  active: number;
  outdated: number;
  failed: number;
  lastRun: string | null;
}

export interface MarketingService {
  id: string;
  property_id: string;
  service_type: string;
  status: string;
  provider: string;
}

export interface DashboardData {
  properties: Property[];
  packageDeployments: Deployment[];
  skillCounts: SkillCount[];
  marketingServices: MarketingService[];
}

export interface ByPropertyIndex {
  deployMap: Map<string, Deployment[]>;
  skillMap: Map<string, SkillCount>;
  mktMap: Map<string, MarketingService[]>;
}
