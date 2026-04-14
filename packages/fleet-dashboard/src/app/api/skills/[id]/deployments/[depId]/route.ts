import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  getDeploymentById,
  listRuns,
  updateDeployment,
  removeDeployment,
  pinDeployment,
  unpinDeployment,
} from "@pandotic/skill-library/data/hub-skill-deployments";
import { getSkillById } from "@pandotic/skill-library/data/hub-skills";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const { id, depId } = await params;
    const supabase = await createAdminClient();

    const [deployment, runs, skill] = await Promise.all([
      getDeploymentById(supabase, depId),
      listRuns(supabase, { deploymentId: depId, limit: 20 }),
      getSkillById(supabase, id),
    ]);

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    // Fetch property name
    const { data: property } = await supabase
      .from("hub_properties")
      .select("id, name, slug, url")
      .eq("id", deployment.property_id)
      .maybeSingle();

    return NextResponse.json({
      data: { deployment, runs, skill, property },
    });
  } catch (e) {
    return apiError(e);
  }
}

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
