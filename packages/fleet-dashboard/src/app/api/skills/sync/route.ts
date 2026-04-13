import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { syncManifestToDb } from "@pandotic/skill-library/data/manifest-sync";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const result = await syncManifestToDb(supabase);
    return NextResponse.json({ data: result });
  } catch (e) {
    return apiError(e);
  }
}
