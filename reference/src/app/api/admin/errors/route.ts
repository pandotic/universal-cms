import { NextRequest, NextResponse } from "next/server";
import { getErrors } from "@/lib/data/error-log";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") || undefined;
    const category = searchParams.get("category") || undefined;
    const resolvedParam = searchParams.get("resolved");
    const resolved =
      resolvedParam === "true" ? true :
      resolvedParam === "false" ? false :
      undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;

    const data = await getErrors({ severity, category, resolved, limit });
    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
