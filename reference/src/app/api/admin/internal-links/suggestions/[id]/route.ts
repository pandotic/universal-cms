import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api/auth";
import { updateLinkSuggestion } from "@/lib/data/internal-links";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body.status;

    if (status !== "accepted" && status !== "dismissed") {
      return NextResponse.json(
        { error: "status must be 'accepted' or 'dismissed'" },
        { status: 400 }
      );
    }

    await updateLinkSuggestion(id, status);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
