import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { listProperties } from "@pandotic/universal-cms/data/hub";
import { syncPropertyCmsDeployment } from "@pandotic/universal-cms/data/hub-package-deployments";
import { CMS_VERSION } from "@pandotic/universal-cms/version";
import type { HubProperty } from "@pandotic/universal-cms/types/hub";

interface HealthResponse {
  status?: string;
  version?: string;
  siteName?: string;
  enabledModules?: string[];
  disabledModules?: string[];
}

interface SyncResult {
  propertyId: string;
  propertyName: string;
  status: "synced" | "unreachable" | "no_cms";
  installedVersion?: string;
  error?: string;
}

async function checkSiteHealth(url: string): Promise<HealthResponse | null> {
  const endpoint = `${url.replace(/\/+$/, "")}/api/admin/health`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const properties = await listProperties(supabase, { status: "active" });

    const results: SyncResult[] = [];

    await Promise.all(
      properties.map(async (property: HubProperty) => {
        const health = await checkSiteHealth(property.url);

        if (!health) {
          results.push({
            propertyId: property.id,
            propertyName: property.name,
            status: "unreachable",
            error: "Could not reach health endpoint",
          });
          return;
        }

        if (!health.version) {
          results.push({
            propertyId: property.id,
            propertyName: property.name,
            status: "no_cms",
          });
          return;
        }

        await syncPropertyCmsDeployment(
          supabase,
          property.id,
          {
            version: health.version,
            enabledModules: health.enabledModules ?? [],
            disabledModules: health.disabledModules,
            siteName: health.siteName,
          },
          CMS_VERSION
        );

        results.push({
          propertyId: property.id,
          propertyName: property.name,
          status: "synced",
          installedVersion: health.version,
        });
      })
    );

    const synced = results.filter((r) => r.status === "synced").length;
    const unreachable = results.filter((r) => r.status === "unreachable").length;
    const noCms = results.filter((r) => r.status === "no_cms").length;

    return NextResponse.json({
      data: {
        results,
        summary: {
          total: properties.length,
          synced,
          unreachable,
          noCms,
          latestVersion: CMS_VERSION,
        },
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
