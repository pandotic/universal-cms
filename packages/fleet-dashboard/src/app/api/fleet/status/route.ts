import { NextResponse } from "next/server";
import { fleet, type FleetSite } from "@/fleet.config";

interface HealthResponse {
  status: string;
  version?: string;
  siteName?: string;
  enabledModules?: string[];
  disabledModules?: string[];
  moduleCount?: { enabled: number; disabled: number };
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
  error?: string;
  checkedAt: string;
}

async function checkSite(site: FleetSite): Promise<SiteResult> {
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
      error: message,
      checkedAt,
    };
  }
}

export async function GET() {
  const sites = await Promise.all(fleet.map(checkSite));

  return NextResponse.json(
    { sites },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
