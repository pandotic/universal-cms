import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listLinkSubmissions,
  createLinkSubmission,
  getLinkBuildingStats,
} from "@pandotic/universal-cms/data/hub-link-building";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const params = request.nextUrl.searchParams;

    const view = params.get("view");
    if (view === "stats") {
      const propertyId = params.get("propertyId");
      if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });
      const stats = await getLinkBuildingStats(supabase, propertyId);
      return NextResponse.json({ data: stats });
    }

    const propertyId = params.get("propertyId") ?? undefined;
    const opportunityId = params.get("opportunityId") ?? undefined;
    const status = params.get("status") as any ?? undefined;
    const limit = params.get("limit") ? parseInt(params.get("limit")!) : undefined;
    const offset = params.get("offset") ? parseInt(params.get("offset")!) : undefined;

    const submissions = await listLinkSubmissions(supabase, { propertyId, opportunityId, status, limit, offset });
    return NextResponse.json({ data: submissions });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();

    const submission = await createLinkSubmission(supabase, {
      property_id: body.property_id,
      opportunity_id: body.opportunity_id,
      status: body.status ?? "queued",
      submitted_url: body.submitted_url ?? null,
      submitted_at: body.submitted_at ?? null,
      verified_at: null,
      last_checked_at: null,
      is_live: null,
      notes: body.notes ?? null,
    });
    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
