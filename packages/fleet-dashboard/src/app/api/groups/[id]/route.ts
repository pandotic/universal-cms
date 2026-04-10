import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  getGroupById,
  updateGroup,
  deleteGroup,
} from "@pandotic/universal-cms/data/hub-groups";
import { logHubActivity } from "@pandotic/universal-cms/data/hub-activity";
import { getHubUser } from "@pandotic/universal-cms/data/hub-users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
      "member",
      "viewer",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const group = await getGroupById(supabase, id);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ data: group });
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
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    const group = await updateGroup(supabase, id, body);
    return NextResponse.json({ data: group });
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
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (user) {
      const hubUser = await getHubUser(supabase, user.id);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        group_id: id,
        action: "delete",
        entity_type: "group",
        entity_id: id,
        description: `Deleted group`,
      });
    }

    await deleteGroup(supabase, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
