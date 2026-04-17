import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listLinkOpportunities,
  createLinkOpportunity,
} from "@pandotic/universal-cms/data/hub-link-building";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const params = request.nextUrl.searchParams;

    const category = params.get("category") ?? undefined;
    const priority = params.get("priority") as any ?? undefined;
    const limit = params.get("limit") ? parseInt(params.get("limit")!) : undefined;
    const offset = params.get("offset") ? parseInt(params.get("offset")!) : undefined;

    const opportunities = await listLinkOpportunities(supabase, { category, priority, limit, offset });
    return NextResponse.json({ data: opportunities });
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

    const opportunity = await createLinkOpportunity(supabase, {
      name: body.name,
      url: body.url,
      category: body.category ?? null,
      industry: body.industry ?? [],
      domain_authority: body.domain_authority ?? null,
      priority: body.priority ?? null,
      submission_method: body.submission_method ?? null,
      notes: body.notes ?? null,
    });
    return NextResponse.json({ data: opportunity }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
