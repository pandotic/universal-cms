export interface FleetSite {
  name: string;
  url: string;
  healthEndpoint: string;
  environment: "production" | "staging" | "development";
}

export const fleet: FleetSite[] = [
  // Add your deployed sites here:
  // { name: "ESGsource", url: "https://esgsource.com", healthEndpoint: "/api/admin/health", environment: "production" },
];
