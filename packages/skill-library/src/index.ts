// ─── Skill Library ────────────────────────────────────────────────────────
// Re-exports for convenience. Individual subpath imports are preferred
// for tree-shaking in consuming apps.

export * from "./types/index";
export * from "./data/hub-skills";
export * from "./data/hub-skill-deployments";
export * from "./deploy/index";
export {
  createSkillPR,
  updateSkillPR,
  listRepoSkills,
} from "./deploy/github-pr";
export {
  loadSkillsManifest,
  loadKBManifest,
  getSkillContent,
  getKBContent,
  syncManifestToDb,
  computeContentHash,
} from "./data/manifest-sync";
export { marketingSkillTemplates, getTemplateBySlug } from "./skills/marketing/index";
