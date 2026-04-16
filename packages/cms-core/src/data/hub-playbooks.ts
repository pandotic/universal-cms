import type { HubProperty } from "../types/hub";
import type {
  PlaybookConfig,
  PlaybookType,
  SetupTaskTemplate,
} from "../types/hub-playbooks";
import { relationshipTypeToPlaybook } from "../types/hub-playbooks";

const PLAYBOOKS: Record<PlaybookType, PlaybookConfig> = {
  pandotic_studio: {
    type: "pandotic_studio",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "research", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "case_study"],
    crossPromotion: true,
    brandIsolation: false,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
  pandotic_studio_product: {
    type: "pandotic_studio_product",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "landing_page"],
    crossPromotion: true,
    brandIsolation: false,
    pressStrategy: "studio_attribution",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
  gbi_personal: {
    type: "gbi_personal",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "research", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "featured_pitch", "guest_post"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
  pandotic_client: {
    type: "pandotic_client",
    enabledDepartments: ["marketing_director", "content_creative"],
    contentTypes: ["case_study", "press"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "studio_attribution",
    socialStrategy: "skip",
    linkBuildingTiers: [],
    featuredComEnabled: false,
    newsletterEnabled: false,
    podcastBookingEnabled: false,
  },
  local_service: {
    type: "local_service",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "operations"],
    contentTypes: ["blog", "social", "press"],
    crossPromotion: false,
    brandIsolation: false,
    pressStrategy: "local",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2"],
    featuredComEnabled: false,
    newsletterEnabled: false,
    podcastBookingEnabled: false,
  },
  standalone: {
    type: "standalone",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "featured_pitch"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
};

export function getPlaybookForProperty(property: HubProperty): PlaybookConfig {
  const playbookType = relationshipTypeToPlaybook(property.relationship_type);
  return PLAYBOOKS[playbookType];
}

export function getPlaybookByType(type: PlaybookType): PlaybookConfig {
  return PLAYBOOKS[type];
}

const TIER_1_SOCIAL_PROFILES: SetupTaskTemplate[] = [
  { category: "social_profiles", task_name: "Create LinkedIn Company Page", platform: "linkedin", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "social_profiles", task_name: "Create Twitter/X Account", platform: "twitter", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "social_profiles", task_name: "Create Facebook Business Page", platform: "facebook", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "social_profiles", task_name: "Create YouTube Channel", platform: "youtube", tier: "tier_1", execution_mode: "semi_automated" },
];

const TIER_2_SOCIAL_PROFILES: SetupTaskTemplate[] = [
  { category: "social_profiles", task_name: "Create Crunchbase Profile", platform: "crunchbase", tier: "tier_2", execution_mode: "semi_automated" },
  { category: "social_profiles", task_name: "Create Instagram Business Account", platform: "instagram", tier: "tier_2", execution_mode: "semi_automated" },
  { category: "social_profiles", task_name: "Create Pinterest Business Account", platform: "pinterest", tier: "tier_2", execution_mode: "semi_automated" },
];

const TIER_3_SOCIAL_PROFILES: SetupTaskTemplate[] = [
  { category: "social_profiles", task_name: "Create Medium Publication", platform: "medium", tier: "tier_3", execution_mode: "semi_automated" },
  { category: "social_profiles", task_name: "Create Threads Account", platform: "threads", tier: "tier_3", execution_mode: "semi_automated" },
  { category: "social_profiles", task_name: "Create Bluesky Account", platform: "bluesky", tier: "tier_3", execution_mode: "semi_automated" },
];

const BRAND_IDENTITY_TASKS: SetupTaskTemplate[] = [
  { category: "brand_identity", task_name: "Create Brand Voice Brief", platform: null, tier: "tier_1", execution_mode: "manual" },
  { category: "brand_identity", task_name: "Generate Brand Assets (descriptions, bios, boilerplate)", platform: null, tier: "tier_1", execution_mode: "automated" },
  { category: "brand_identity", task_name: "Set Up Brand Kit in Canva", platform: "canva", tier: "tier_1", execution_mode: "manual" },
  { category: "brand_identity", task_name: "Create Templated.io Templates", platform: "templated", tier: "tier_2", execution_mode: "manual" },
];

const LEGAL_TASKS: SetupTaskTemplate[] = [
  { category: "legal", task_name: "Generate Privacy Policy", platform: "termly", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "legal", task_name: "Generate Terms of Service", platform: "termly", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "legal", task_name: "Set Up Cookie Consent Banner", platform: null, tier: "tier_1", execution_mode: "semi_automated" },
];

const ANALYTICS_TASKS: SetupTaskTemplate[] = [
  { category: "analytics", task_name: "Set Up Site Analytics", platform: "rybbit", tier: "tier_1", execution_mode: "manual" },
  { category: "analytics", task_name: "Register with Google Search Console", platform: "google", tier: "tier_1", execution_mode: "manual" },
  { category: "analytics", task_name: "Register with Bing Webmaster Tools", platform: "bing", tier: "tier_2", execution_mode: "manual" },
];

const EMAIL_TASKS: SetupTaskTemplate[] = [
  { category: "email_platform", task_name: "Set Up Email Platform (Beehiiv)", platform: "beehiiv", tier: "tier_1", execution_mode: "manual" },
  { category: "email_platform", task_name: "Create Welcome Email Sequence", platform: null, tier: "tier_2", execution_mode: "automated" },
  { category: "email_platform", task_name: "Create Lead Magnet", platform: null, tier: "tier_2", execution_mode: "manual" },
];

const PRESS_KIT_TASKS: SetupTaskTemplate[] = [
  { category: "press_kit", task_name: "Create Press Kit Page", platform: null, tier: "tier_2", execution_mode: "automated" },
  { category: "press_kit", task_name: "Generate JSON-LD Schema", platform: null, tier: "tier_1", execution_mode: "automated" },
];

const REVIEW_SITE_TASKS_SAAS: SetupTaskTemplate[] = [
  { category: "review_sites", task_name: "Claim G2 Profile", platform: "g2", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "review_sites", task_name: "Claim Capterra Profile", platform: "capterra", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "review_sites", task_name: "Claim TrustPilot Profile", platform: "trustpilot", tier: "tier_2", execution_mode: "semi_automated" },
];

const REVIEW_SITE_TASKS_LOCAL: SetupTaskTemplate[] = [
  { category: "review_sites", task_name: "Set Up Google Business Profile", platform: "google", tier: "tier_1", execution_mode: "manual" },
  { category: "review_sites", task_name: "Claim Yelp Profile", platform: "yelp", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "review_sites", task_name: "Claim BBB Profile", platform: "bbb", tier: "tier_1", execution_mode: "semi_automated" },
  { category: "review_sites", task_name: "Claim Angi Profile", platform: "angi", tier: "tier_2", execution_mode: "semi_automated" },
  { category: "review_sites", task_name: "Claim Thumbtack Profile", platform: "thumbtack", tier: "tier_2", execution_mode: "semi_automated" },
];

const DIRECTORY_TASKS: SetupTaskTemplate[] = [
  { category: "directories", task_name: "Submit to General Directories (Hotfrog, Manta)", platform: null, tier: "tier_2", execution_mode: "semi_automated" },
  { category: "directories", task_name: "Submit to Industry-Specific Directories", platform: null, tier: "tier_2", execution_mode: "semi_automated" },
];

export function getDefaultSetupTasksForPlaybook(
  playbookType: PlaybookType
): SetupTaskTemplate[] {
  const tasks: SetupTaskTemplate[] = [
    ...BRAND_IDENTITY_TASKS,
    ...TIER_1_SOCIAL_PROFILES,
    ...LEGAL_TASKS,
    ...ANALYTICS_TASKS,
    ...PRESS_KIT_TASKS,
  ];

  if (playbookType === "pandotic_client") {
    return tasks.filter((t) => t.category === "brand_identity");
  }

  tasks.push(...TIER_2_SOCIAL_PROFILES);
  tasks.push(...TIER_3_SOCIAL_PROFILES);
  tasks.push(...DIRECTORY_TASKS);

  const playbook = PLAYBOOKS[playbookType];

  if (playbook.newsletterEnabled) {
    tasks.push(...EMAIL_TASKS);
  }

  if (playbookType === "local_service") {
    tasks.push(...REVIEW_SITE_TASKS_LOCAL);
  } else if (
    playbookType === "pandotic_studio_product" ||
    playbookType === "pandotic_studio"
  ) {
    tasks.push(...REVIEW_SITE_TASKS_SAAS);
  }

  return tasks;
}
