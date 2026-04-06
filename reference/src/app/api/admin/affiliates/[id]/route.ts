import { NextRequest, NextResponse } from "next/server";
import {
  updateAffiliateProgram,
  deleteAffiliateProgram,
} from "@/lib/data/affiliates";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const program = await updateAffiliateProgram(id, body);
    return NextResponse.json({ data: program });
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
    await deleteAffiliateProgram(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
