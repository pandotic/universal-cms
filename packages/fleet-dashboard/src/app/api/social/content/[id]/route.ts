import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  getSocialContentById,
  updateSocialContent,
  deleteSocialContent,
  publishSocialContent,
  archiveSocialContent,
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
    const content = await getSocialContentById(supabase, id);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ data: content });
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

    let content;
    if (body.status === "published") {
      content = await publishSocialContent(supabase, id);
    } else if (body.status === "archived") {
      content = await archiveSocialContent(supabase, id);
    } else {
      content = await updateSocialContent(supabase, id, body);
    }

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      const action = body.status === "published" ? "publish" : body.status === "archived" ? "archive" : "update";
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: content.property_id,
        action,
        entity_type: "social_content",
        entity_id: id,
        description: `${action === "publish" ? "Published" : action === "archive" ? "Archived" : "Updated"} social content`,
      });
    }

    return NextResponse.json({ data: content });
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

    const content = await getSocialContentById(supabase, id);

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: content?.property_id,
        action: "delete",
        entity_type: "social_content",
        entity_id: id,
        description: `Deleted social content`,
      });
    }

    await deleteSocialContent(supabase, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
