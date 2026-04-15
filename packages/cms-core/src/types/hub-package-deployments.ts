// ─── Hub Package Deployment Types ──────────────────────────────────────────
// Tracks npm package versions deployed across fleet properties.

export type PackageDeployStatus = "active" | "pending" | "failed" | "not_installed";

export type PackageCategory = "cms" | "library" | "ui" | "tool";

export type PackageDeploymentEventType =
  | "installed"
  | "upgraded"
  | "modules_changed"
  | "health_check"
  | "failed"
  | "rolled_back";

export interface HubPackageDeployment {
  id: string;
  property_id: string;
  package_name: string;
  package_category: PackageCategory;
  installed_version: string | null;
  latest_version: string | null;
  pinned: boolean;
  enabled_modules: string[];
  bespoke_modules: string[];
  preset: string | null;
  status: PackageDeployStatus;
  github_repo: string | null;
  github_pr_url: string | null;
  deployed_by: string | null;
  deployed_at: string | null;
  last_health_check_at: string | null;
  health_check_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type HubPackageDeploymentInsert = Omit<
  HubPackageDeployment,
  "id" | "created_at" | "updated_at"
>;

export type HubPackageDeploymentUpdate = Partial<
  Omit<HubPackageDeployment, "id" | "property_id" | "package_name" | "created_at" | "updated_at">
>;

export interface HubPackageDeploymentEvent {
  id: string;
  deployment_id: string;
  property_id: string;
  event_type: PackageDeploymentEventType;
  from_version: string | null;
  to_version: string | null;
  modules_added: string[];
  modules_removed: string[];
  notes: string | null;
  metadata: Record<string, unknown>;
  triggered_by: string | null;
  created_at: string;
}

export type HubPackageDeploymentEventInsert = Omit<
  HubPackageDeploymentEvent,
  "id" | "created_at"
>;

export interface PackageDeploymentFilters {
  propertyId?: string;
  packageName?: string;
  packageCategory?: PackageCategory;
  status?: PackageDeployStatus;
}

export interface PackageMatrixCell {
  deployment_id: string;
  property_id: string;
  package_name: string;
  package_category: PackageCategory;
  installed_version: string | null;
  latest_version: string | null;
  status: PackageDeployStatus;
  pinned: boolean;
  module_count: number;
}
