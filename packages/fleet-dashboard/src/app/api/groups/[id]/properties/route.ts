import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  getGroupProperties,
  addPropertyToGroup,
  removePropertyFromGroup,
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
    const properties = await getGroupProperties(supabase, id);

    return NextResponse.json({ data: properties });
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
    let hubUserId: string | undefined;
    if (user) {
      const hubUser = await getHubUser(supabase, user.id);
      hubUserId = hubUser?.id;
    }

    await addPropertyToGroup(supabase, id, body.property_id, hubUserId);

    if (hubUserId) {
      await logHubActivity(supabase, {
        user_id: hubUserId,
        group_id: id,
        property_id: body.property_id,
        action: "add_property",
        entity_type: "group_property",
        description: `Added property to group`,
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

    await removePropertyFromGroup(supabase, id, body.property_id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
