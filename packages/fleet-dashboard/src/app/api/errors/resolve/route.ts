import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiError, requireHubRole } from "@pandotic/universal-cms/middleware";
import { resolveErrors } from "@pandotic/universal-cms/data/errors";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
      "member",
    ]);
    if (authError) return authError;

    const body = (await request.json().catch(() => null)) as
      | { ids?: unknown }
      | null;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((v): v is string => typeof v === "string")
      : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const { data: userRes } = await (await createClient()).auth.getUser();
    const supabase = await createAdminClient();
    await resolveErrors(supabase, ids, userRes.user?.id ?? null);

    return NextResponse.json({ ok: true, resolved: ids.length });
  } catch (e) {
    return apiError(e);
  }
}
