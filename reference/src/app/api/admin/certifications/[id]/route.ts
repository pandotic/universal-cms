import { NextRequest, NextResponse } from "next/server";
import {
  getCertificationWithRules,
  updateCertification,
  deleteCertification,
} from "@/lib/data/certifications";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const result = await getCertificationWithRules(id);
    if (!result) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: result });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const certification = await updateCertification(id, body);
    return NextResponse.json({ data: certification });
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
    await deleteCertification(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
