import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAllReviews } from "@pandotic/universal-cms/data/reviews";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") ?? undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const offset = searchParams.get("offset")
      ? Number(searchParams.get("offset"))
      : undefined;

    const result = await getAllReviews(supabase, {
      status: status as Parameters<typeof getAllReviews>[1] extends { status?: infer S } ? S : never,
      limit,
      offset,
    });

    return NextResponse.json({ data: result.reviews, total: result.total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
