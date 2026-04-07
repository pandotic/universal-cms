import { NextRequest, NextResponse } from "next/server";
import { getAllContentPages, createContentPage } from "@/lib/data/content-pages";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const pages = await getAllContentPages();
    return NextResponse.json({ data: pages });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const page = await createContentPage(body);
    return NextResponse.json({ data: page }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
