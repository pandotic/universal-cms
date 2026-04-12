// ─── Skill Library ────────────────────────────────────────────────────────
// Re-exports for convenience. Individual subpath imports are preferred
// for tree-shaking in consuming apps.

export * from "./types/index";
export * from "./data/hub-skills";
export * from "./data/hub-skill-deployments";
export * from "./deploy/index";
export { marketingSkillTemplates, getTemplateBySlug } from "./skills/marketing/index";
