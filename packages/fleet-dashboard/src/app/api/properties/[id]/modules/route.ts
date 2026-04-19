import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  getPropertyById,
  updateProperty,
} from "@pandotic/universal-cms/data/hub";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
      "member",
      "viewer",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const property = await getPropertyById(supabase, id);

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: property.id,
        slug: property.slug,
        enabled_modules: property.enabled_modules,
        preset: property.preset,
        package_version: property.package_version,
        target_package_version: property.target_package_version,
        last_module_sync_at: property.last_module_sync_at,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, ["super_admin"]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const body = (await request.json()) as {
      enabled_modules?: string[];
      preset?: string | null;
      target_package_version?: string | null;
    };

    const updates: Record<string, unknown> = {
      last_module_sync_at: null,
    };
    if (Array.isArray(body.enabled_modules)) {
      updates.enabled_modules = body.enabled_modules;
    }
    if (body.preset !== undefined) {
      updates.preset = body.preset;
    }
    if (body.target_package_version !== undefined) {
      updates.target_package_version = body.target_package_version;
    }

    const property = await updateProperty(supabase, id, updates);
    return NextResponse.json({
      data: {
        id: property.id,
        slug: property.slug,
        enabled_modules: property.enabled_modules,
        preset: property.preset,
        package_version: property.package_version,
        target_package_version: property.target_package_version,
        last_module_sync_at: property.last_module_sync_at,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
