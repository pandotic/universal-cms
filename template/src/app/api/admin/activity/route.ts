import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getActivityLog } from "@pandotic/universal-cms/data/activity";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get("entityType") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const offset = searchParams.get("offset")
      ? Number(searchParams.get("offset"))
      : undefined;

    const result = await getActivityLog(supabase, {
      entityType,
      action: action as Parameters<typeof getActivityLog>[1] extends { action?: infer A } ? A : never,
      limit,
      offset,
    });

    return NextResponse.json({ data: result.entries, total: result.total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
