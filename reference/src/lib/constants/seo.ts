export const SITE_CONFIG = {
  name: "ESGsource",
  url: "https://esgsource.com",
  tagline: "Navigate the ESG Ecosystem",
  description:
    "The definitive guide to ESG standards, data providers, software, and service providers. Practical information for companies building their ESG programs.",
  ogImage: "/opengraph-image",
  twitterHandle: "@esgsource",
} as const;

export function buildTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_CONFIG.name}`;
}

export function buildCanonicalUrl(path: string): string {
  return `${SITE_CONFIG.url}${path}`;
}
