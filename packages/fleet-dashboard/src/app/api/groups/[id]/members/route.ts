import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  getGroupMembers,
  addUserToGroup,
  removeUserFromGroup,
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
    const members = await getGroupMembers(supabase, id);

    return NextResponse.json({ data: members });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    const {
      data: { user },
    } = await authClient.auth.getUser();
    let grantedBy: string | undefined;
    if (user) {
      const hubUser = await getHubUser(supabase, user.id);
      grantedBy = hubUser?.id;
    }

    await addUserToGroup(supabase, id, body.user_id, body.role, grantedBy);

    if (grantedBy) {
      await logHubActivity(supabase, {
        user_id: grantedBy,
        group_id: id,
        action: "add_member",
        entity_type: "group_member",
        entity_id: body.user_id,
        description: `Added user to group with role "${body.role}"`,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
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
      "group_admin",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    await removeUserFromGroup(supabase, id, body.user_id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
