import { NextRequest, NextResponse } from "next/server";
import { updateMedia, deleteMedia } from "@/lib/data/media";
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
    const media = await updateMedia(id, {
      alt_text: body.alt_text,
      caption: body.caption,
    });
    return NextResponse.json({ data: media });
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
    await deleteMedia(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
