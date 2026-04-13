// Re-export all project types from the universal CMS package.
// This preserves the @/types/projects import path for existing site code.
export type {
  Project,
  ProjectSection,
  SectionType,
  ParsedFeature,
  ParsedProofPoint,
  ParsedTechDifferentiator,
  ParsedCaseStudy,
  ParsedProductPage,
  ParsedBlurbs,
  ParsedPortfolio,
  ProjectWithContent,
} from "@pandotic/universal-cms/types/projects";
