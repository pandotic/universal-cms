import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { listPlaybookTemplates } from "@pandotic/universal-cms/data/hub-playbooks";
import { listPlaybookRuns } from "@pandotic/universal-cms/data/hub-playbooks";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId") ?? undefined;

    const [templates, runs] = await Promise.all([
      listPlaybookTemplates(supabase),
      listPlaybookRuns(supabase, { propertyId }),
    ]);

    return NextResponse.json({ data: { templates, runs } });
  } catch (e) {
    return apiError(e);
  }
}
