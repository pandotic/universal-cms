import { NextRequest, NextResponse } from "next/server";
import { getAllCtaBlocks, createCtaBlock } from "@/lib/data/cta-blocks";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const blocks = await getAllCtaBlocks();
    return NextResponse.json({ data: blocks });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const block = await createCtaBlock(body);
    return NextResponse.json({ data: block }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
