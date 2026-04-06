import { NextRequest, NextResponse } from "next/server";
import { resolveError } from "@/lib/data/error-log";
import { requireAdmin, apiError } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const resolvedBy = body.resolved_by ?? undefined;
    await resolveError(id, resolvedBy);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const sb = await getSupabaseAdmin();
    const { error } = await sb.from('error_log').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
