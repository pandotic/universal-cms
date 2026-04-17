import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  getLinkOpportunityById,
  updateLinkOpportunity,
  deleteLinkOpportunity,
} from "@pandotic/universal-cms/data/hub-link-building";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const { id } = await params;
    const opportunity = await getLinkOpportunityById(supabase, id);
    if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: opportunity });
  } catch (e) {
    return apiError(e);
  }
}

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

    const opportunity = await updateLinkOpportunity(supabase, id, body);
    return NextResponse.json({ data: opportunity });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { id } = await params;
    await deleteLinkOpportunity(supabase, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
