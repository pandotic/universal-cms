import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import { updateLinkSubmission } from "@pandotic/universal-cms/data/hub-link-building";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { id } = await params;
    const body = await request.json();

    const submission = await updateLinkSubmission(supabase, id, body);
    return NextResponse.json({ data: submission });
  } catch (e) {
    return apiError(e);
  }
}
