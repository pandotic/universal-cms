import { NextRequest, NextResponse } from "next/server";
import { getActivityLog } from "@/lib/data/activity-log";
import type { ActivityAction } from "@/lib/data/activity-log";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || undefined;
    const action = (searchParams.get("action") as ActivityAction) || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    const result = await getActivityLog({ entityType, action, limit, offset });
    return NextResponse.json({ data: result.entries, total: result.total });
  } catch (e) {
    return apiError(e);
  }
}
