import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  getPackageDeploymentById,
  updatePackageDeployment,
} from "@pandotic/universal-cms/data/hub-package-deployments";
import { listPackageDeploymentEvents } from "@pandotic/universal-cms/data/hub-package-deployments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { id } = await params;
    const [deployment, events] = await Promise.all([
      getPackageDeploymentById(supabase, id),
      listPackageDeploymentEvents(supabase, id),
    ]);

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { ...deployment, events } });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { id } = await params;
    const body = await request.json();
    const updated = await updatePackageDeployment(supabase, id, body);
    return NextResponse.json({ data: updated });
  } catch (e) {
    return apiError(e);
  }
}
