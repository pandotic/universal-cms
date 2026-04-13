import type { Project } from "@/types/projects";

/**
 * Legacy projects that don't yet have content folders in pandotic-content-output/.
 * These render as cards on the index page but have no detail pages.
 * As content folders are created, these entries can be removed.
 */
export const legacyProjects: Project[] = [
  {
    id: "usgbc-smart-building",
    slug: "usgbc-smart-building",
    name: "USGBC-CA unveils Smart Building Assistant",
    client: "USGBC-CA",
    tagline:
      "AI Building Performance Chatbot trained on USGBC-CA data and building codes",
    status: "published",
    category: "green-buildings",
    has_live_demo: false,
    demo_url: null,
    live_url: null,
    own_site_url: null,
    repo_url: null,
    hero_screenshot: null,
    video_long_id: null,
    video_short_id: null,
    tags: ["ai-chatbot", "building-codes", "energy-efficiency", "usgbc"],
    sort_order: 0,
    has_detail_page: false,
  },
  {
    id: "home-energy-planner",
    slug: "home-energy-planner",
    name: "HomeEnergyPlanner\u2122",
    client: "internal",
    tagline:
      "Data-driven platform that models energy use, rebates, and upgrades for homeowners",
    status: "published",
    category: "green-buildings",
    has_live_demo: false,
    demo_url: null,
    live_url: "https://www.HomeEnergyPlanner.com",
    own_site_url: "https://www.HomeEnergyPlanner.com",
    repo_url: null,
    hero_screenshot: null,
    video_long_id: null,
    video_short_id: null,
    tags: ["energy", "rebates", "homeowner", "electrification"],
    sort_order: 1,
    has_detail_page: false,
  },
  {
    id: "fireshield",
    slug: "fireshield",
    name: "FireShield Home Defense",
    client: "internal",
    tagline:
      "AI-driven fire safety analyzer for wildfire risk assessment and home hardening plans",
    status: "published",
    category: "green-buildings",
    has_live_demo: false,
    demo_url: null,
    live_url: null,
    own_site_url: null,
    repo_url: null,
    hero_screenshot: null,
    video_long_id: null,
    video_short_id: null,
    tags: ["wildfire", "risk-assessment", "ai", "geospatial"],
    sort_order: 2,
    has_detail_page: false,
  },
  {
    id: "bdc-contractor-hub",
    slug: "bdc-contractor-hub",
    name: "BDC Colorado AI Contractor Assistant",
    client: "BDC Colorado",
    tagline:
      "AI-powered contractor hub for clean-energy project communication and compliance",
    status: "published",
    category: "green-buildings",
    has_live_demo: false,
    demo_url: null,
    live_url: null,
    own_site_url: null,
    repo_url: null,
    hero_screenshot: null,
    video_long_id: null,
    video_short_id: null,
    tags: ["ai-chatbot", "contractors", "clean-energy", "colorado"],
    sort_order: 3,
    has_detail_page: false,
  },
  {
    id: "robin",
    slug: "robin",
    name: "ROBIN Curriculum Engine",
    client: "ROBIN",
    tagline:
      "AI-powered curriculum engine that learns from each district to deliver local alignment",
    status: "published",
    category: "education",
    has_live_demo: false,
    demo_url: null,
    live_url: null,
    own_site_url: null,
    repo_url: null,
    hero_screenshot: null,
    video_long_id: null,
    video_short_id: null,
    tags: ["education", "curriculum", "ai", "k-12"],
    sort_order: 0,
    has_detail_page: false,
  },
];

/**
 * Extended project data with descriptions for the index page cards.
 * This maps slug → description for legacy projects that don't have markdown content.
 */
export const legacyDescriptions: Record<string, string> = {
  "usgbc-smart-building":
    "This AI Building Performance Chatbot is trained on USGBC-CA\u2019s data and building codes, ensuring accuracy and saving time. It addresses four key use cases: benchmarking requirements, upgrade options, rebates, financing, and BPS policy. The tool adapts its responses based on user type and building information, helping users confirm compliance, investigate retrofit opportunities, identify incentives, and evaluate the financial impact of energy efficiency upgrades.",
  "home-energy-planner":
    "HomeEnergyPlanner is a data-driven platform that models energy use, rebates, and upgrades to help homeowners optimize efficiency and lower costs.",
  fireshield:
    "FireShield uses advanced AI and geospatial tech to identify wildfire risks and recommend mitigation upgrades. Our platform powers assessments, certifications, and contractor-ready home hardening plans.",
  "bdc-contractor-hub":
    "Developed for the Colorado Building Decarbonization Coalition, this AI-powered Contractor Hub streamlines communication, documentation, and compliance for clean-energy projects statewide. Trained on BDC policies and partner data, it helps contractors identify incentives, manage project workflows, and maintain funding eligibility\u2014all within a single intelligent workspace.",
  robin:
    "Pandotic partnered with ROBIN to build an AI-powered curriculum engine that learns from each district\u2019s standards, priorities, and community context to deliver truly local alignment. The platform ingests existing materials, assessments, and real-time classroom data to adapt recommendations for each school, grade, and teacher. ROBIN helps districts continuously refine their curriculum with evidence-based insights instead of one-size-fits-all programs, improving relevance, equity, and outcomes.",
};

/** Category display metadata */
export const categories: Record<
  string,
  { title: string; description: string }
> = {
  "green-buildings": {
    title: "Powering Green Buildings & Electrification",
    description:
      "Our team brings unmatched experience leveraging technology and data to move us towards a more sustainable future - one building at a time.",
  },
  education: {
    title: "Elevating Higher Ed and Online Education with AI",
    description:
      "Our team brings deep expertise in education technology, building AI-powered tools that enhance learning outcomes and empower educators.",
  },
  proptech: {
    title: "Home Intelligence & Property Technology",
    description:
      "AI-powered platforms that help homeowners, contractors, and partners make smarter decisions about homes and properties.",
  },
};
