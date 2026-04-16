import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listContentPipelineItems,
  createContentPipelineItem,
  getContentPipelineStats,
} from "@pandotic/universal-cms/data/hub-content-pipeline";

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
      if (!propertyId) return NextResponse.json({ error: "propertyId required for stats" }, { status: 400 });
      const stats = await getContentPipelineStats(supabase, propertyId);
      return NextResponse.json({ data: stats });
    }

    const propertyId = params.get("propertyId") ?? undefined;
    const channel = params.get("channel") as any ?? undefined;
    const status = params.get("status") as any ?? undefined;
    const platform = params.get("platform") ?? undefined;
    const draftedByAgent = params.get("draftedByAgent") ?? undefined;
    const limit = params.get("limit") ? parseInt(params.get("limit")!) : undefined;
    const offset = params.get("offset") ? parseInt(params.get("offset")!) : undefined;

    const items = await listContentPipelineItems(supabase, {
      propertyId, channel, status, platform, draftedByAgent, limit, offset,
    });
    return NextResponse.json({ data: items });
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

    const item = await createContentPipelineItem(supabase, {
      ...body,
      created_by: userId,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
