import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  getAgentById,
  listAgentRuns,
  createAgentRun,
} from "@pandotic/universal-cms/data/hub-agents";
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
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status") as any ?? undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;

    const runs = await listAgentRuns(supabase, id, { status, limit, offset });
    return NextResponse.json({ data: runs });
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
    const userId = await getCurrentUserId(authClient);

    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();

    const agent = await getAgentById(supabase, id);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const run = await createAgentRun(supabase, {
      agent_id: id,
      status: "pending",
      started_at: null,
      completed_at: null,
      result: null,
      error_message: null,
      triggered_by: "manual",
      property_id: agent.property_id,
    });

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: agent.property_id,
        action: "trigger",
        entity_type: "agent_run",
        entity_id: run.id,
        description: `Manually triggered agent "${agent.name}"`,
      });
    }

    return NextResponse.json({ data: run }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
