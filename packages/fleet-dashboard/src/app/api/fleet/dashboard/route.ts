import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { listProperties } from "@pandotic/universal-cms/data/hub";
import { listPackageDeployments } from "@pandotic/universal-cms/data/hub-package-deployments";
import { listMarketingServices } from "@pandotic/universal-cms/data/hub-marketing";
import { listDeploymentMatrix } from "@pandotic/skill-library/data/hub-skill-deployments";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();

    // Tolerate missing tables — optional modules (package deployments,
    // marketing, skills) might not have their migrations applied yet.
    // Properties is required; everything else degrades to an empty list.
    const settled = await Promise.allSettled([
      listProperties(supabase),
      listPackageDeployments(supabase),
      listMarketingServices(supabase),
      listDeploymentMatrix(supabase),
    ]);

    const warnings: string[] = [];
    const pickOrEmpty = <T>(
      result: PromiseSettledResult<T[]>,
      label: string,
    ): T[] => {
      if (result.status === "fulfilled") return result.value;
      warnings.push(
        `${label}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
      );
      return [];
    };

    if (settled[0].status === "rejected") {
      return apiError(settled[0].reason);
    }
    const properties = settled[0].value;
    const packageDeployments = pickOrEmpty(settled[1], "packageDeployments");
    const marketingServices = pickOrEmpty(settled[2], "marketingServices");
    const skillDeployments = pickOrEmpty(settled[3], "skillDeployments");

    // Compute skill counts per property
    const skillCountMap = new Map<
      string,
      { active: number; outdated: number; failed: number; lastRun: string | null }
    >();

    for (const cell of skillDeployments) {
      const existing = skillCountMap.get(cell.property_id) ?? {
        active: 0,
        outdated: 0,
        failed: 0,
        lastRun: null,
      };

      if (cell.status === "active") existing.active++;
      if (cell.status === "failed") existing.failed++;
      if (
        cell.deployed_version !== cell.current_version &&
        cell.status !== "removed"
      ) {
        existing.outdated++;
      }

      skillCountMap.set(cell.property_id, existing);
    }

    const skillCounts = Array.from(skillCountMap.entries()).map(
      ([property_id, counts]) => ({
        property_id,
        ...counts,
      })
    );

    return NextResponse.json({
      data: {
        properties,
        packageDeployments,
        marketingServices,
        skillCounts,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (e) {
    return apiError(e);
  }
}
