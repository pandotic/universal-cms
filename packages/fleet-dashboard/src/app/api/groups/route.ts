import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  listGroups,
  createGroup,
} from "@pandotic/universal-cms/data/hub-groups";
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
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();

    const group = await createGroup(supabase, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      group_type: body.group_type,
    });

    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (user) {
      const hubUser = await getHubUser(supabase, user.id);
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
