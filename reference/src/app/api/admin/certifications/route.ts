import { NextRequest, NextResponse } from "next/server";
import {
  getAllCertifications,
  createCertification,
} from "@/lib/data/certifications";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const certifications = await getAllCertifications();
    return NextResponse.json({ data: certifications });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const certification = await createCertification(body);
    return NextResponse.json({ data: certification }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
