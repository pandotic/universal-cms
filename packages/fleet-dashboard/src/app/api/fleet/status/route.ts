import { NextResponse } from "next/server";
import { fleet, type FleetSite } from "@/fleet.config";
import { createAdminClient } from "@/lib/supabase/server";
import { listProperties } from "@pandotic/universal-cms/data/hub";
import type { HubProperty } from "@pandotic/universal-cms/types/hub";

interface HealthResponse {
  status: string;
  version?: string;
  siteName?: string;
  enabledModules?: string[];
  disabledModules?: string[];
  moduleCount?: { enabled: number; disabled: number };
  apiUsage?: {
    totalRequests: number;
    totalCostUsd: number;
    providers: Record<string, { requests: number; costUsd: number }>;
  };
}

interface SiteResult {
  name: string;
  url: string;
  environment: string;
  status: "up" | "down" | "unknown";
  version?: string;
  siteName?: string;
  enabledModules?: string[];
  disabledModules?: string[];
  moduleCount?: { enabled: number; disabled: number };
  apiUsage?: HealthResponse["apiUsage"];
  propertyId?: string;
  propertyType?: string;
  error?: string;
  checkedAt: string;
}

interface CheckableSite {
  name: string;
  url: string;
  healthEndpoint: string;
  environment: string;
  propertyId?: string;
  propertyType?: string;
}

async function checkSite(site: CheckableSite): Promise<SiteResult> {
  const checkedAt = new Date().toISOString();
  const endpoint = `${site.url.replace(/\/+$/, "")}${site.healthEndpoint}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        name: site.name,
        url: site.url,
        environment: site.environment,
        status: "down",
        propertyId: site.propertyId,
        propertyType: site.propertyType,
        error: `HTTP ${res.status} ${res.statusText}`,
        checkedAt,
      };
    }

    const data: HealthResponse = await res.json();

    return {
      name: site.name,
      url: site.url,
      environment: site.environment,
      status: "up",
      version: data.version,
      siteName: data.siteName,
      enabledModules: data.enabledModules,
      disabledModules: data.disabledModules,
      moduleCount: data.moduleCount,
      apiUsage: data.apiUsage,
      propertyId: site.propertyId,
      propertyType: site.propertyType,
      checkedAt,
    };
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out (5s)"
        : err instanceof Error
          ? err.message
          : "Unknown error";

    return {
      name: site.name,
      url: site.url,
      environment: site.environment,
      status: "down",
      propertyId: site.propertyId,
      propertyType: site.propertyType,
      error: message,
      checkedAt,
    };
  }
}

function propertyToCheckable(prop: HubProperty): CheckableSite {
  return {
    name: prop.name,
    url: prop.url,
    healthEndpoint: "/api/admin/health",
    environment: "production",
    propertyId: prop.id,
    propertyType: prop.property_type,
  };
}

export async function GET() {
  // Merge sites from both sources: fleet.config.ts (legacy) and property registry (DB)
  const configSites: CheckableSite[] = fleet.map((s: FleetSite) => ({
    name: s.name,
    url: s.url,
    healthEndpoint: s.healthEndpoint,
    environment: s.environment,
  }));

  let dbSites: CheckableSite[] = [];
  try {
    const supabase = await createAdminClient();
    const properties = await listProperties(supabase, { status: "active" });
    dbSites = properties.map(propertyToCheckable);
  } catch {
    // DB not available yet — fall back to config-only
  }

  // Deduplicate by URL (DB takes precedence)
  const dbUrls = new Set(dbSites.map((s) => s.url.replace(/\/+$/, "")));
  const uniqueConfigSites = configSites.filter(
    (s) => !dbUrls.has(s.url.replace(/\/+$/, ""))
  );

  const allSites = [...dbSites, ...uniqueConfigSites];
  const sites = await Promise.all(allSites.map(checkSite));

  return NextResponse.json(
    { sites },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
