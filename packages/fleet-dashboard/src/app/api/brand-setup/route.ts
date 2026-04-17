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
  seedDefaultSetupTasks,
} from "@pandotic/universal-cms/data/hub-brand-setup";
import { getDefaultSetupTasksForPlaybook } from "@pandotic/universal-cms/data/hub-marketing-playbooks";
import { relationshipTypeToPlaybook } from "@pandotic/universal-cms/types/hub-marketing-playbooks";

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

    if (body.action === "seed") {
      const playbookType = relationshipTypeToPlaybook(body.relationship_type);
      const templates = getDefaultSetupTasksForPlaybook(playbookType);
      const tasks = templates.map(t => ({
        category: t.category as any,
        task_name: t.task_name,
        platform: t.platform,
        tier: t.tier,
        execution_mode: t.execution_mode,
        property_id: body.property_id,
        status: "pending" as const,
        completed_at: null,
        completed_by: null,
        result_url: null,
        notes: null,
      }));
      const seeded = await seedDefaultSetupTasks(supabase, body.property_id, tasks);
      return NextResponse.json({ data: seeded }, { status: 201 });
    }

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
