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

// ─── API Key Registry ───────────────────────────────────────────────────────
// Central registry of API keys across all projects.
// key_hint is the last 4 characters only — NEVER store full keys here.

export interface ApiKeyEntry {
  provider: string;
  keyName: string;
  keyHint: string;
  environment: "production" | "staging" | "development";
  projectName: string;
  isActive: boolean;
  monthlyBudgetUsd: number | null;
  notes: string | null;
}

export const apiKeys: ApiKeyEntry[] = [
  // Example:
  // {
  //   provider: "anthropic",
  //   keyName: "ESGsource Production",
  //   keyHint: "...a1b2",
  //   environment: "production",
  //   projectName: "ESGsource",
  //   isActive: true,
  //   monthlyBudgetUsd: 500,
  //   notes: "Main Claude API key for AI chat and content generation",
  // },
];

// ─── Vendor Invoice Data ────────────────────────────────────────────────────
// Import vendor invoice amounts for audit/reconciliation.

export interface VendorInvoice {
  provider: string;
  periodStart: string; // ISO date
  periodEnd: string;
  invoiceAmountUsd: number;
  invoiceId?: string;
  notes?: string;
}

export const vendorInvoices: VendorInvoice[] = [
  // Example:
  // {
  //   provider: "anthropic",
  //   periodStart: "2026-03-01",
  //   periodEnd: "2026-03-31",
  //   invoiceAmountUsd: 847.23,
  //   invoiceId: "INV-2026-03",
  //   notes: "March 2026 Claude API usage",
  // },
];
