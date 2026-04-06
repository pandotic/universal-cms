// Central data access barrel — the single swap point for migrating to a database.
// All pages and components import from here, never directly from JSON files.

// JSON-based data (local files)
export * from "./categories";
export * from "./entities";
export * from "./frameworks";
export * from "./glossary";
export * from "./relationships";

// CMS data (Supabase-backed)
export * from "./content-pages";
export * from "./media";
export * from "./site-settings";
export * from "./activity-log";
export * from "./listicles";
export * from "./reviews";
export * from "./click-analytics";
export * from "./affiliates";
export * from "./certifications";
