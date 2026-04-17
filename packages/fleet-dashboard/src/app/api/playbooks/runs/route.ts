import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { startPlaybookRun } from "@pandotic/universal-cms/data/hub-playbooks";
import { getCurrentUserId } from "@/lib/middleware/admin-rbac";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, ["super_admin", "group_admin", "member"]);
    if (authError) return authError;

    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { templateId, propertyId } = await request.json() as { templateId: string; propertyId: string };
    if (!templateId || !propertyId) {
      return NextResponse.json({ error: "templateId and propertyId required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const run = await startPlaybookRun(supabase, templateId, propertyId, userId);
    return NextResponse.json({ data: run }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
