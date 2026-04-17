import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  logQALearning,
  getRecentLearnings,
} from "@pandotic/universal-cms/data/hub-qa";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const params = request.nextUrl.searchParams;
    const propertyId = params.get("propertyId");
    if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

    const limit = params.get("limit") ? parseInt(params.get("limit")!) : 50;
    const learnings = await getRecentLearnings(supabase, propertyId, limit);
    return NextResponse.json({ data: learnings });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const body = await request.json();

    const entry = await logQALearning(supabase, {
      property_id: body.property_id ?? null,
      check_type: body.check_type ?? null,
      outcome: body.outcome ?? null,
      human_feedback: body.human_feedback ?? null,
    });
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
