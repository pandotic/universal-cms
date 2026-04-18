import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiError } from "@pandotic/universal-cms/middleware";
import { getRecentHubActivity } from "@pandotic/universal-cms/data/hub-activity";
import { requireHubRole } from "@pandotic/universal-cms/middleware";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);

    const activity = await getRecentHubActivity(supabase, limit);
    return NextResponse.json({ data: activity });
  } catch (e) {
    return apiError(e);
  }
}
