// ─── Brand Assets Types ───────────────────────────────────────────────────
// Derivative brand assets per property: descriptions, social bios, NAP, press boilerplate.

export interface HubBrandAsset {
  id: string;
  property_id: string;
  description_25: string | null;
  description_50: string | null;
  description_100: string | null;
  description_250: string | null;
  description_500: string | null;
  bio_twitter: string | null;
  bio_linkedin: string | null;
  bio_instagram: string | null;
  bio_facebook: string | null;
  category_primary: string | null;
  categories_secondary: string[];
  keywords: string[];
  press_boilerplate: string | null;
  hashtags: Record<string, unknown>;
  logo_urls: Record<string, unknown>;
  nap_name: string | null;
  nap_address: string | null;
  nap_phone: string | null;
  nap_email: string | null;
  schema_jsonld: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type HubBrandAssetInsert = Omit<
  HubBrandAsset,
  "id" | "created_at" | "updated_at"
>;

export type HubBrandAssetUpdate = Partial<
  Omit<HubBrandAsset, "id" | "property_id" | "created_at" | "updated_at">
>;
