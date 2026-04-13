import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listHubUsers,
  updateHubUser,
} from "@pandotic/universal-cms/data/hub-users";
import { logHubActivity } from "@pandotic/universal-cms/data/hub-activity";
import { getHubUser } from "@pandotic/universal-cms/data/hub-users";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    // Allow any authenticated user to list (RLS will filter)
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
    const userId = await getCurrentUserId(authClient);

    // Require platform admin for updates
    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();

    const { id, ...updates } = body;
    const user = await updateHubUser(supabase, id, updates);

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
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
