// Re-export all markdown parsers from the universal CMS package.
// This preserves the @/lib/markdown import path for existing site code.
export {
  parseFeatures,
  parseProofPoints,
  parseTechDifferentiators,
  parseProductPage,
  parseCaseStudy,
  parseBlurbs,
  parsePortfolio,
} from "@pandotic/universal-cms/data/project-parsers";
