import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { getPlaybookRunWithProgress } from "@pandotic/universal-cms/data/hub-playbooks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const { runId } = await params;
    const supabase = await createAdminClient();
    const run = await getPlaybookRunWithProgress(supabase, runId);
    return NextResponse.json({ data: run });
  } catch (e) {
    return apiError(e);
  }
}
