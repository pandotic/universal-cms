import { NextRequest, NextResponse } from "next/server";
import { get404Logs } from "@/lib/data/link-checker";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 200;
    const logs = await get404Logs(limit);
    return NextResponse.json({ data: logs });
  } catch (e) {
    return apiError(e);
  }
}
