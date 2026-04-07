import { NextRequest, NextResponse } from "next/server";
import { updateReviewStatus, deleteReview } from "@/lib/data/reviews";
import type { ReviewStatus } from "@/lib/data/reviews";
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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    const review = await updateReviewStatus(id, status as ReviewStatus);
    return NextResponse.json({ data: review });
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
    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
