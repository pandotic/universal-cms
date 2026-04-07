import { NextResponse } from "next/server";
import { CMS_VERSION } from "@pandotic/universal-cms/version";
import type { CmsModuleName } from "@pandotic/universal-cms/config";
import { cmsConfig } from "@/cms.config";
import { createAdminClient } from "@/lib/supabase/server";

const startedAt = Date.now();

export async function GET() {
  const enabledModules = Object.entries(cmsConfig.modules)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name as CmsModuleName);

  const disabledModules = Object.entries(cmsConfig.modules)
    .filter(([, enabled]) => !enabled)
    .map(([name]) => name as CmsModuleName);

  // Optionally include API usage summary for the current month
  let apiUsage: {
    totalRequests: number;
    totalCostUsd: number;
    providers: Record<string, { requests: number; costUsd: number }>;
  } | undefined;

  if (cmsConfig.modules.apiUsage) {
    try {
      const client = await createAdminClient();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data } = await client
        .from("api_usage")
        .select("provider, cost_usd")
        .gte("created_at", monthStart);

      if (data && data.length > 0) {
        const providers: Record<string, { requests: number; costUsd: number }> = {};
        let totalRequests = 0;
        let totalCostUsd = 0;

        for (const row of data) {
          const p = row.provider;
          if (!providers[p]) providers[p] = { requests: 0, costUsd: 0 };
          providers[p].requests++;
          providers[p].costUsd += row.cost_usd ?? 0;
          totalRequests++;
          totalCostUsd += row.cost_usd ?? 0;
        }

        apiUsage = { totalRequests, totalCostUsd, providers };
      }
    } catch {
      // API usage table may not exist yet — skip gracefully
    }
  }

  return NextResponse.json({
    version: CMS_VERSION,
    siteName: cmsConfig.siteName,
    siteUrl: cmsConfig.siteUrl,
    enabledModules,
    disabledModules,
    moduleCount: { enabled: enabledModules.length, disabled: disabledModules.length },
    uptimeMs: Date.now() - startedAt,
    ...(apiUsage && { apiUsage }),
  });
}
