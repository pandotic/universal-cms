import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  listHubUsers,
  updateHubUser,
} from "@pandotic/universal-cms/data/hub-users";
import { logHubActivity } from "@pandotic/universal-cms/data/hub-activity";
import { getHubUser } from "@pandotic/universal-cms/data/hub-users";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
      "member",
      "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const users = await listHubUsers(supabase);
    return NextResponse.json({ data: users });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();

    const { id, ...updates } = body;
    const user = await updateHubUser(supabase, id, updates);

    const {
      data: { user: authUser },
    } = await authClient.auth.getUser();
    if (authUser) {
      const hubUser = await getHubUser(supabase, authUser.id);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        action: "update_role",
        entity_type: "user",
        entity_id: id,
        description: `Updated user role to "${updates.hub_role}"`,
      });
    }

    return NextResponse.json({ data: user });
  } catch (e) {
    return apiError(e);
  }
}
