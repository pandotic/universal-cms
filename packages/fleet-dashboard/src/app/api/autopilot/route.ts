import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  getAutoPilotSettings,
  upsertAutoPilotSettings,
} from "@pandotic/universal-cms/data/hub-qa";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const propertyId = request.nextUrl.searchParams.get("propertyId");
    if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

    const settings = await getAutoPilotSettings(supabase, propertyId);
    return NextResponse.json({ data: settings });
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

    const settings = await upsertAutoPilotSettings(supabase, {
      property_id: body.property_id,
      content_type: body.content_type,
      auto_pilot_enabled: body.auto_pilot_enabled ?? false,
      confidence_threshold: body.confidence_threshold ?? 0.85,
      trust_score: body.trust_score ?? 0,
      max_per_day: body.max_per_day ?? null,
    });
    return NextResponse.json({ data: settings });
  } catch (e) {
    return apiError(e);
  }
}
