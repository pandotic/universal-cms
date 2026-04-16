import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listAgents,
  createAgent,
} from "@pandotic/universal-cms/data/hub-agents";
import { logHubActivity } from "@pandotic/universal-cms/data/hub-activity";
import { getHubUser } from "@pandotic/universal-cms/data/hub-users";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    const propertyId = searchParams.get("propertyId") ?? undefined;
    const agentType = searchParams.get("agentType") as any ?? undefined;
    const enabledParam = searchParams.get("enabled");
    const enabled = enabledParam !== null ? enabledParam === "true" : undefined;

    const agents = await listAgents(supabase, { propertyId, agentType, enabled });
    return NextResponse.json({ data: agents });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();

    const agent = await createAgent(supabase, {
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      agent_type: body.agent_type,
      config: body.config ?? {},
      enabled: body.enabled ?? true,
      schedule: body.schedule ?? null,
      property_id: body.property_id,
      created_by: userId!,
    });

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: body.property_id,
        action: "create",
        entity_type: "agent",
        entity_id: agent.id,
        description: `Created agent "${agent.name}"`,
      });
    }

    return NextResponse.json({ data: agent }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
