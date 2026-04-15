import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  listPackageDeployments,
  upsertPackageDeployment,
} from "@pandotic/universal-cms/data/hub-package-deployments";
import type { PackageDeploymentFilters } from "@pandotic/universal-cms/types/hub-package-deployments";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const filters: PackageDeploymentFilters = {};
    if (searchParams.get("property_id")) filters.propertyId = searchParams.get("property_id")!;
    if (searchParams.get("package_name")) filters.packageName = searchParams.get("package_name")!;
    if (searchParams.get("package_category")) filters.packageCategory = searchParams.get("package_category") as any;
    if (searchParams.get("status")) filters.status = searchParams.get("status") as any;

    const deployments = await listPackageDeployments(supabase, filters);
    return NextResponse.json({ data: deployments });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();
    const deployment = await upsertPackageDeployment(supabase, body);
    return NextResponse.json({ data: deployment }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
