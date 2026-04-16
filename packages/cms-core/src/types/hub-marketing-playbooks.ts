// ─── Playbook Types ───────────────────────────────────────────────────────
// Marketing playbook configuration: different strategies per brand relationship type.

import type { RelationshipType } from "./hub";

export type PlaybookType =
  | "pandotic_studio"
  | "pandotic_studio_product"
  | "gbi_personal"
  | "pandotic_client"
  | "local_service"
  | "standalone";

export interface PlaybookConfig {
  type: PlaybookType;
  enabledDepartments: string[];
  contentTypes: string[];
  crossPromotion: boolean;
  brandIsolation: boolean;
  pressStrategy: "national" | "local" | "studio_attribution" | "skip";
  socialStrategy: "own_handles" | "shared_handles" | "skip";
  linkBuildingTiers: string[];
  featuredComEnabled: boolean;
  newsletterEnabled: boolean;
  podcastBookingEnabled: boolean;
}

export interface SetupTaskTemplate {
  category: string;
  task_name: string;
  platform: string | null;
  tier: "tier_1" | "tier_2" | "tier_3" | null;
  execution_mode: "automated" | "semi_automated" | "manual";
}

export function relationshipTypeToPlaybook(
  relationshipType: RelationshipType | null
): PlaybookType {
  switch (relationshipType) {
    case "pandotic_studio":
      return "pandotic_studio";
    case "pandotic_studio_product":
      return "pandotic_studio_product";
    case "gbi_personal":
      return "gbi_personal";
    case "pandotic_client":
      return "pandotic_client";
    case "local_service":
      return "local_service";
    case "standalone":
    default:
      return "standalone";
  }
}
