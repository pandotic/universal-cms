import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { listDeploymentMatrix } from "@pandotic/skill-library/data/hub-skill-deployments";
import { listSkills } from "@pandotic/skill-library/data/hub-skills";
import { listProperties } from "@pandotic/universal-cms/data/hub";
import { listPackageDeploymentMatrix } from "@pandotic/universal-cms/data/hub-package-deployments";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const [cells, skills, properties, npmPackages] = await Promise.all([
      listDeploymentMatrix(supabase),
      listSkills(supabase, { scope: "site" as any }),
      listProperties(supabase),
      listPackageDeploymentMatrix(supabase),
    ]);

    return NextResponse.json({
      data: { cells, skills, properties, npmPackages },
    });
  } catch (e) {
    return apiError(e);
  }
}
