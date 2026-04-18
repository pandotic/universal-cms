import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { completePlaybookStep } from "@pandotic/universal-cms/data/hub-playbooks";
import { getCurrentUserId } from "@/lib/middleware/admin-rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string; stepId: string }> },
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, ["super_admin", "group_admin", "member"]);
    if (authError) return authError;

    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { stepId } = await params;
    const body = await request.json() as { notes?: string };

    const supabase = await createAdminClient();
    await completePlaybookStep(supabase, stepId, userId, body.notes);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
