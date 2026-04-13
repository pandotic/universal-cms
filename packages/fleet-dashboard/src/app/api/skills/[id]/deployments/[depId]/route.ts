import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  updateDeployment,
  removeDeployment,
  pinDeployment,
  unpinDeployment,
} from "@pandotic/skill-library/data/hub-skill-deployments";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const { depId } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    // Handle pin/unpin actions
    if (body.action === "pin") {
      const result = await pinDeployment(supabase, depId);
      return NextResponse.json({ data: result });
    }
    if (body.action === "unpin") {
      const result = await unpinDeployment(supabase, depId);
      return NextResponse.json({ data: result });
    }

    const deployment = await updateDeployment(supabase, depId, body);
    return NextResponse.json({ data: deployment });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, ["super_admin"]);
    if (authError) return authError;

    const { depId } = await params;
    const supabase = await createAdminClient();
    await removeDeployment(supabase, depId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
