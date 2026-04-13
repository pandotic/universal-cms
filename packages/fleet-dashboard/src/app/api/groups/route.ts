import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listGroups,
  createGroup,
} from "@pandotic/universal-cms/data/hub-groups";
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
    const type = request.nextUrl.searchParams.get("type") as
      | "client"
      | "internal"
      | "custom"
      | null;

    const groups = await listGroups(supabase, type ? { type } : undefined);
    return NextResponse.json({ data: groups });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    // Require platform admin for creation
    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();

    const group = await createGroup(supabase, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      group_type: body.group_type,
    });

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        group_id: group.id,
        action: "create",
        entity_type: "group",
        entity_id: group.id,
        description: `Created group "${group.name}"`,
      });
    }

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
