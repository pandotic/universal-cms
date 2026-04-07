import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";
import { getErrors } from "@pandotic/universal-cms/data/errors";

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const severity = searchParams.get("severity") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const resolvedParam = searchParams.get("resolved");
    const resolved =
      resolvedParam === "true" ? true : resolvedParam === "false" ? false : undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;

    const data = await getErrors(supabase, {
      severity,
      category,
      resolved,
      limit,
    });

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
