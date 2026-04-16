import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listSetupTasks,
  createSetupTask,
  updateSetupTask,
  completeSetupTask,
  getSetupProgress,
} from "@pandotic/universal-cms/data/hub-brand-setup";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const params = request.nextUrl.searchParams;
    const propertyId = params.get("propertyId");
    if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

    const view = params.get("view");
    if (view === "progress") {
      const progress = await getSetupProgress(supabase, propertyId);
      return NextResponse.json({ data: progress });
    }

    const category = params.get("category") as any ?? undefined;
    const status = params.get("status") as any ?? undefined;

    const tasks = await listSetupTasks(supabase, propertyId, { category, status });
    return NextResponse.json({ data: tasks });
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

    if (body.action === "complete") {
      const task = await completeSetupTask(supabase, body.id, body.result_url, body.completed_by);
      return NextResponse.json({ data: task });
    }

    if (body.action === "update") {
      const task = await updateSetupTask(supabase, body.id, body.updates);
      return NextResponse.json({ data: task });
    }

    const task = await createSetupTask(supabase, body);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
