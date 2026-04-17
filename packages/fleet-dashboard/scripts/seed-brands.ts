/**
 * Seeds the 15 Pandotic + GBI brands into hub_properties on the Hub Supabase
 * project (rimbgolutrxpmwsoswhq). Idempotent: upserts on `slug`.
 *
 * Usage:
 *   SUPABASE_URL=https://<project>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
 *   pnpm --filter @pandotic/fleet-dashboard seed-brands
 *
 * The script runs in two phases so studio products can FK their parent_property_id
 * to the freshly-inserted Pandotic row.
 */

import { createClient } from "@supabase/supabase-js";

type RelationshipType =
  | "gbi_personal"
  | "pandotic_studio"
  | "pandotic_studio_product"
  | "pandotic_client";

type SiteProfile = "marketing_only" | "marketing_and_cms" | "app_only" | "local_service";

type BusinessStage = "active" | "maintenance";

interface BrandSeed {
  name: string;
  slug: string;
  domain: string;
  relationship_type: RelationshipType;
  site_profile: SiteProfile;
  business_stage: BusinessStage;
}

const PHASE_A_BRANDS: BrandSeed[] = [
  // GBI Personal
  { name: "SafeMama", slug: "safemama", domain: "safemama.com", relationship_type: "gbi_personal", site_profile: "marketing_and_cms", business_stage: "active" },
  { name: "Thermostating", slug: "thermostating", domain: "thermostating.com", relationship_type: "gbi_personal", site_profile: "marketing_and_cms", business_stage: "active" },
  { name: "Home Energy Planner", slug: "homeep", domain: "homeenergyplanner.com", relationship_type: "gbi_personal", site_profile: "marketing_and_cms", business_stage: "active" },
  { name: "Help My Boomer", slug: "helpmyboomer", domain: "helpmyboomer.com", relationship_type: "gbi_personal", site_profile: "marketing_and_cms", business_stage: "active" },
  { name: "ESGsource", slug: "esgsource", domain: "esgsource.com", relationship_type: "gbi_personal", site_profile: "marketing_and_cms", business_stage: "active" },
  { name: "ThankBetter", slug: "thankbetter", domain: "thankbetter.com", relationship_type: "gbi_personal", site_profile: "marketing_only", business_stage: "active" },
  { name: "Case Finders", slug: "casefinders", domain: "casefinders.com", relationship_type: "gbi_personal", site_profile: "marketing_only", business_stage: "maintenance" },

  // Pandotic Studio (must be inserted before Phase B so its id can be captured)
  { name: "Pandotic", slug: "pandotic", domain: "pandotic.ai", relationship_type: "pandotic_studio", site_profile: "marketing_and_cms", business_stage: "active" },

  // Pandotic Clients
  { name: "Riffle CM", slug: "riffle", domain: "rifflecm.com", relationship_type: "pandotic_client", site_profile: "app_only", business_stage: "active" },
  { name: "POS360", slug: "pos360", domain: "pos360.com", relationship_type: "pandotic_client", site_profile: "app_only", business_stage: "active" },
  { name: "Archer Review", slug: "archer", domain: "archerreview.com", relationship_type: "pandotic_client", site_profile: "app_only", business_stage: "active" },
];

const PHASE_B_PRODUCTS: BrandSeed[] = [
  { name: "Pandotic SPEED", slug: "speed", domain: "speed.pandotic.ai", relationship_type: "pandotic_studio_product", site_profile: "marketing_only", business_stage: "active" },
  { name: "BidSmart", slug: "bidsmart", domain: "bidsmart.pandotic.ai", relationship_type: "pandotic_studio_product", site_profile: "marketing_only", business_stage: "active" },
  { name: "HomeDoc", slug: "homedoc", domain: "homedoc.pandotic.ai", relationship_type: "pandotic_studio_product", site_profile: "marketing_only", business_stage: "active" },
  { name: "StudyPuppy", slug: "studypuppy", domain: "studypuppy.com", relationship_type: "pandotic_studio_product", site_profile: "marketing_only", business_stage: "active" },
  { name: "ThinkAlike", slug: "thinkalike", domain: "thinkalike.app", relationship_type: "pandotic_studio_product", site_profile: "app_only", business_stage: "active" },
  { name: "FireShield Defense", slug: "fireshield", domain: "fireshielddefense.com", relationship_type: "pandotic_studio_product", site_profile: "local_service", business_stage: "active" },
  { name: "LeadSmart", slug: "leadsmart", domain: "leadsmart.pandotic.ai", relationship_type: "pandotic_studio_product", site_profile: "marketing_only", business_stage: "active" },
];

function rowFor(brand: BrandSeed, parentId: string | null) {
  return {
    name: brand.name,
    slug: brand.slug,
    url: `https://${brand.domain}`,
    domains: [brand.domain],
    relationship_type: brand.relationship_type,
    site_profile: brand.site_profile,
    business_stage: brand.business_stage,
    property_type: brand.site_profile === "app_only" ? "app" : "site",
    enabled_modules: [] as string[],
    github_default_branch: "main",
    cms_installed: false,
    onboarding_status: "complete",
    parent_property_id: parentId,
  };
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Seeding ${PHASE_A_BRANDS.length + PHASE_B_PRODUCTS.length} brands into hub_properties...`);

  const phaseARows = PHASE_A_BRANDS.map((b) => rowFor(b, null));
  const { data: phaseAData, error: phaseAError } = await supabase
    .from("hub_properties")
    .upsert(phaseARows, { onConflict: "slug" })
    .select("id, slug, name, relationship_type");

  if (phaseAError) throw new Error(`Phase A upsert failed: ${phaseAError.message}`);
  console.log(`  Phase A: upserted ${phaseAData?.length ?? 0} rows.`);

  const pandoticRow = phaseAData?.find((r) => r.slug === "pandotic");
  if (!pandoticRow) throw new Error("Pandotic row not returned from Phase A upsert; cannot link studio products.");
  const pandoticId = pandoticRow.id;
  console.log(`  Pandotic id captured: ${pandoticId}`);

  const phaseBRows = PHASE_B_PRODUCTS.map((b) => rowFor(b, pandoticId));
  const { data: phaseBData, error: phaseBError } = await supabase
    .from("hub_properties")
    .upsert(phaseBRows, { onConflict: "slug" })
    .select("id, slug, name, relationship_type");

  if (phaseBError) throw new Error(`Phase B upsert failed: ${phaseBError.message}`);
  console.log(`  Phase B: upserted ${phaseBData?.length ?? 0} rows.`);

  const all = [...(phaseAData ?? []), ...(phaseBData ?? [])];
  console.log("\nSeeded brands:");
  for (const row of all.sort((a, b) => a.relationship_type.localeCompare(b.relationship_type) || a.name.localeCompare(b.name))) {
    console.log(`  [${row.relationship_type.padEnd(24)}] ${row.slug.padEnd(16)} ${row.name}`);
  }
  console.log(`\nDone. Total: ${all.length} brands.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
