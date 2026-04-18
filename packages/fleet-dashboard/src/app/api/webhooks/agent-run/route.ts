import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { updateAgentRun } from "@pandotic/universal-cms/data/hub-agents";

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ??
      request.headers.get("authorization")?.replace("Bearer ", "");

    const secret = process.env.AGENT_WEBHOOK_SECRET;
    if (!secret || apiKey !== secret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { run_id, status, result, error_message } = body;

    if (!run_id || !status) {
      return NextResponse.json(
        { error: "Bad request: run_id and status are required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const updates: Record<string, unknown> = { status };
    if (result !== undefined) updates.result = result;
    if (error_message !== undefined) updates.error_message = error_message;
    if (status === "completed" || status === "failed" || status === "cancelled") {
      updates.completed_at = new Date().toISOString();
    }
    if (status === "running") {
      updates.started_at = new Date().toISOString();
    }

    const updatedRun = await updateAgentRun(supabase, run_id, updates);

    return NextResponse.json({ data: updatedRun });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
