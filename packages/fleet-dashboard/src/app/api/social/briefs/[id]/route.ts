import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  getBriefById,
  updateBrief,
  deleteBrief,
} from "@pandotic/universal-cms/data/hub-social";
import { logHubActivity } from "@pandotic/universal-cms/data/hub-activity";
import { getHubUser } from "@pandotic/universal-cms/data/hub-users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createAdminClient();
    const brief = await getBriefById(supabase, id);

    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json({ data: brief });
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

    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    const brief = await updateBrief(supabase, id, body);

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: brief.property_id,
        action: "update",
        entity_type: "brand_voice_brief",
        entity_id: id,
        description: `Updated brand voice brief "${brief.name}"`,
      });
    }

    return NextResponse.json({ data: brief });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();

    const brief = await getBriefById(supabase, id);

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: brief?.property_id,
        action: "delete",
        entity_type: "brand_voice_brief",
        entity_id: id,
        description: `Deleted brand voice brief "${brief?.name}"`,
      });
    }

    await deleteBrief(supabase, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
