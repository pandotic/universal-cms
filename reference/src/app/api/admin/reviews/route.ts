import { NextRequest, NextResponse } from "next/server";
import { getAllReviews, bulkUpdateReviewStatus } from "@/lib/data/reviews";
import type { ReviewStatus } from "@/lib/data/reviews";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as ReviewStatus) || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    const result = await getAllReviews({ status, entityType, limit, offset });
    return NextResponse.json({
      data: result.reviews,
      total: result.total,
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || !status) {
      return NextResponse.json(
        { error: "ids (array) and status are required" },
        { status: 400 }
      );
    }

    await bulkUpdateReviewStatus(ids, status as ReviewStatus);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
