import { NextRequest, NextResponse } from "next/server";
import {
  getAllAffiliatePrograms,
  createAffiliateProgram,
} from "@/lib/data/affiliates";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const programs = await getAllAffiliatePrograms();
    return NextResponse.json({ data: programs });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const program = await createAffiliateProgram(body);
    return NextResponse.json({ data: program }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
