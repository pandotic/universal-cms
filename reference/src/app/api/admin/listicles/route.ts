import { NextRequest, NextResponse } from "next/server";
import { getAllListicles, createListicle } from "@/lib/data/listicles";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const listicles = await getAllListicles();
    return NextResponse.json({ data: listicles });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const listicle = await createListicle(body);
    return NextResponse.json({ data: listicle }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
