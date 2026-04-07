import { NextRequest, NextResponse } from "next/server";
import {
  getCtaBlockById,
  updateCtaBlock,
  deleteCtaBlock,
} from "@/lib/data/cta-blocks";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const block = await getCtaBlockById(id);
    if (!block) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: block });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const block = await updateCtaBlock(id, body);
    return NextResponse.json({ data: block });
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
    await deleteCtaBlock(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
