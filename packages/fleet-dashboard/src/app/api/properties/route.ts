import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listProperties,
  createProperty,
} from "@pandotic/universal-cms/data/hub";
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
    const properties = await listProperties(supabase);
    return NextResponse.json({ data: properties });
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

    const property = await createProperty(supabase, {
      name: body.name,
      slug: body.slug,
      url: body.url,
      property_type: body.property_type,
      preset: body.preset ?? null,
      enabled_modules: body.enabled_modules ?? [],
      supabase_project_ref: body.supabase_project_ref ?? null,
      supabase_url: body.supabase_url ?? null,
      status: body.status ?? "active",
      last_deploy_at: body.last_deploy_at ?? null,
      ssl_expires_at: body.ssl_expires_at ?? null,
    });

    // Log activity
    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: property.id,
        action: "create",
        entity_type: "property",
        entity_id: property.id,
        description: `Registered property "${property.name}"`,
      });
    }

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
